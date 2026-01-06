import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { info, warn, error } from "firebase-functions/logger";
import path from "path";
import { readFile } from "fs/promises";
import pLimit from "p-limit";

const MAX_PER_PAGE = 10;       // Strava's max page size
const API_LIMIT_DAILY = 1000;   // Strava's daily read limit is 1000
const API_LIMIT_NOW = 1;      // Safety limit for a single execution
const DS_FILE_PATH = "private/data.json";
const SECRET_DOC_PATH = "main/secret";
const METADATA_DOC_PATH = "main/fetch_metadata";
const CONCURRENCY_LIMIT = 5;    // Number of concurrent API requests

/**
 * Initializes Firestore with local secrets for emulation.
 */
async function initFirestore(db) {
    try {
        const secretJsonPath = path.join(process.cwd(), "secret.json");
        const secretLocal = JSON.parse(await readFile(secretJsonPath, "utf-8"));

        const fetchMetadataJsonPath = path.join(process.cwd(), "fetch_metadata.json");
        const fetchMetadataLocal = JSON.parse(await readFile(fetchMetadataJsonPath, "utf-8"));

        // Split secrets and metadata for initialization
        const secrets = {
            CLIENT_ID: secretLocal.CLIENT_ID,
            CLIENT_SECRET: secretLocal.CLIENT_SECRET,
            AUTH_CODE: secretLocal.AUTH_CODE,
            REFRESH_TOKEN: secretLocal.REFRESH_TOKEN,
            ACCESS_TOKEN: secretLocal.ACCESS_TOKEN,
            EXPIRES_AT: secretLocal.EXPIRES_AT,
            ATHLETE: secretLocal.ATHLETE,
        };

        const metadata = {
            LAST_PAGE_FETCHED: fetchMetadataLocal.LAST_PAGE_FETCHED ?? -1,
            NUM_FETCHES_TODAY: fetchMetadataLocal.NUM_FETCHES_TODAY ?? 0,
            LAST_FETCH_DATE: fetchMetadataLocal.LAST_FETCH_DATE ?? "",
            LAST_FETCHED: fetchMetadataLocal.LAST_FETCHED ?? 0,
        };

        await db.doc(SECRET_DOC_PATH).set(secrets);
        await db.doc(METADATA_DOC_PATH).set(metadata);

        info("Firestore initialized with local secret.json (secret and fetch_metadata)");
    } catch (err) {
        warn("Firestore initialization skipped or failed:", err.message);
    }
}

/**
 * Handles OAuth2 token retrieval and refresh logic.
 */
async function getAccessToken(secretDb) {
    const docRef = secretDb.doc(SECRET_DOC_PATH);
    const snap = await docRef.get();
    if (!snap.exists) throw new Error("Secret document not found in Firestore.");

    const secret = snap.data();
    const nowInSeconds = Math.floor(Date.now() / 1000);

    // 1. Initial Authorization if no refresh token exists
    if (!secret.REFRESH_TOKEN) {
        if (!secret.AUTH_CODE) throw new Error("AUTH_CODE missing in secrets. Cannot authorize.");

        info("Exchanging AUTH_CODE for tokens...");
        const response = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: secret.CLIENT_ID,
                client_secret: secret.CLIENT_SECRET,
                code: secret.AUTH_CODE,
                grant_type: "authorization_code",
            }),
        });

        if (!response.ok) throw new Error(`OAuth exchange failed: ${response.statusText}`);
        const resJson = await response.json();

        Object.assign(secret, {
            EXPIRES_AT: resJson.expires_at,
            REFRESH_TOKEN: resJson.refresh_token,
            ACCESS_TOKEN: resJson.access_token,
            ATHLETE: resJson.athlete,
        });

        await docRef.set(secret);
        return secret.ACCESS_TOKEN;
    }

    // 2. Refresh Token if expired or expiring soon (within 10 mins)
    if (!secret.EXPIRES_AT || secret.EXPIRES_AT - nowInSeconds < 600) {
        info("Access token expired or expiring soon. Refreshing...");
        const response = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: secret.CLIENT_ID,
                client_secret: secret.CLIENT_SECRET,
                refresh_token: secret.REFRESH_TOKEN,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) throw new Error(`Token refresh failed: ${response.statusText}`);
        const resJson = await response.json();

        Object.assign(secret, {
            EXPIRES_AT: resJson.expires_at,
            REFRESH_TOKEN: resJson.refresh_token,
            ACCESS_TOKEN: resJson.access_token,
        });

        await docRef.set(secret);
        info("Access token refreshed effectively.");
    }

    return secret.ACCESS_TOKEN;
}

/**
 * Fetches a single page of activities.
 */
async function fetchPage(accessToken, page) {
    const url = `https://www.strava.com/api/v3/athlete/activities?per_page=${MAX_PER_PAGE}&page=${page}`;
    const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 429) {
        warn("Rate limit hit (429).");
        return { status: 429, data: [] };
    }

    if (!response.ok) {
        error(`Failed to fetch page ${page}: ${response.statusText}`);
        return { status: response.status, data: [] };
    }

    const data = await response.json();
    return { status: 200, data };
}

/**
 * Main function to retrieve and synchronize all activities.
 */
async function retrieveAllData(app, bucketName, forceNew = false) {
    const db = getFirestore(app);
    if (process.env.FUNCTIONS_EMULATOR) await initFirestore(db);

    const bucket = getStorage(app).bucket(bucketName);
    const datastoreFile = bucket.file(DS_FILE_PATH);

    // Load existing data
    let datastore = { metadata: {}, data: [] };
    const [exists] = await datastoreFile.exists();
    if (exists) {
        try {
            const url = await getDownloadURL(datastoreFile);
            const res = await fetch(url);
            datastore = await res.json();
            info(`Loaded existing datastore with ${datastore.data.length} activities.`);
        } catch (err) {
            warn("Failed to load existing datastore, starting fresh:", err.message);
        }
    }

    const lastFetched = datastore.metadata.fetchedAt || 0;
    const isOld = Date.now() - lastFetched > 24 * 3600 * 1000;

    if (!isOld && !forceNew) {
        info("Data is up-to-date. Skipping fetch.");
        return;
    }

    // Refresh secrets/limits
    const secretDocRef = db.doc(SECRET_DOC_PATH);
    const metadataDocRef = db.doc(METADATA_DOC_PATH);

    const metadataSnap = await metadataDocRef.get();
    const metadata = metadataSnap.data() || {};

    // Daily Limit check
    const today = new Date().toISOString().split("T")[0];
    const lastFetchDay = metadata.LAST_FETCH_DATE || "";
    if (lastFetchDay !== today) {
        metadata.NUM_FETCHES_TODAY = 0;
        metadata.LAST_FETCH_DATE = today;
    }

    const accessToken = await getAccessToken(db);
    const limit = pLimit(CONCURRENCY_LIMIT);

    // Determine if we are resuming an interrupted fetch or starting fresh
    const isResuming = !forceNew && metadata.LAST_PAGE_FETCHED !== undefined && metadata.LAST_PAGE_FETCHED !== -1;

    let page = isResuming ? metadata.LAST_PAGE_FETCHED + 1 : 1;
    let newData = isResuming ? [...datastore.data] : [];
    let interrupted = false;
    let fetchesDoneNow = 0;

    info(isResuming ? `Resuming fetch from page ${page}...` : "Starting fresh fetch...");

    while (true) {
        // Enforce safety limits
        if (fetchesDoneNow >= API_LIMIT_NOW || (metadata.NUM_FETCHES_TODAY + fetchesDoneNow) >= API_LIMIT_DAILY) {
            warn("Local or global API limit reached. Interrupting...");
            interrupted = true;
            break;
        }

        // We fetch in batches of CONCURRENCY_LIMIT to make use of p-limit
        const pagesToFetch = Array.from({ length: CONCURRENCY_LIMIT }, (_, i) => page + i);
        const results = await Promise.all(
            pagesToFetch.map(p => limit(() => fetchPage(accessToken, p)))
        );

        let stopFetching = false;
        for (let i = 0; i < results.length; i++) {
            const { status, data } = results[i];
            const currentPageNum = pagesToFetch[i];

            if (status === 429) {
                interrupted = true;
                stopFetching = true;
                break;
            }

            if (data.length > 0) {
                newData = newData.concat(data);
                page = currentPageNum; // Mark this page as successfully fetched
                fetchesDoneNow++;

                if (data.length < MAX_PER_PAGE) {
                    info(`Reached end of data at page ${currentPageNum} (items: ${data.length})`);
                    stopFetching = true;
                    break;
                }
            } else {
                info(`Reached end of data (empty page ${currentPageNum})`);
                stopFetching = true;
                break;
            }
        }

        if (stopFetching) break;
    }

    // Update state
    metadata.LAST_PAGE_FETCHED = interrupted ? page : -1;
    metadata.NUM_FETCHES_TODAY = (metadata.NUM_FETCHES_TODAY || 0) + fetchesDoneNow;
    metadata.LAST_FETCHED = Date.now();
    await metadataDocRef.set(metadata);

    // Save to storage
    await datastoreFile.save(JSON.stringify({
        metadata: {
            fetchedAt: Date.now(),
            partialFetch: interrupted,
        },
        data: newData,
    }), {
        contentType: "application/json",
        resumable: false,
    });

    info(`Successfully saved ${newData.length} total activities. Interrupt status: ${interrupted}`);
}

export { retrieveAllData };
