import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { info, warn } from "firebase-functions/logger";
import path from "path";
import { readFile } from "fs/promises";

import { getAccessToken } from "./lib/auth.js";
import { fetchActivities } from "./lib/activities.js";
import { getLoggedInAthlete } from "./lib/athlete.js";

const API_LIMIT_DAILY = 1000;
const API_LIMIT_NOW = 100;
const DS_FILE_PATH = "private/data.json";
const SECRET_DOC_PATH = "main/secret";
const METADATA_DOC_PATH = "main/fetch_metadata";

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
            LAST_PAGE_FETCHED: fetchMetadataLocal.LAST_PAGE_FETCHED ?? 0,
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

    const metadataDocRef = db.doc(METADATA_DOC_PATH);
    const metadataSnap = await metadataDocRef.get();
    const metadata = metadataSnap.data() || {};

    // Daily Limit reset logic
    const today = new Date().toISOString().split("T")[0];
    const lastFetchDay = metadata.LAST_FETCH_DATE || "";
    if (lastFetchDay !== today) {
        metadata.NUM_FETCHES_TODAY = 0;
        metadata.LAST_FETCH_DATE = today;
    }

    const accessToken = await getAccessToken(db);

    // Fetch Athlete Info (New modular functionality demonstration)
    const athlete = await getLoggedInAthlete(accessToken);
    info(`Fetching activities for athlete: ${athlete.firstname} ${athlete.lastname}`);

    // Fetch Activities logic using modular component
    // Resuming fetch from LAST_PAGE_FETCHED + 1
    const startPage = forceNew ? 1 : (metadata.LAST_PAGE_FETCHED || 0) + 1;
    const existingActivities = forceNew ? [] : datastore.data;

    const {
        data: newData,
        lastPageFetched,
        fetchesDoneCount,
        interrupted
    } = await fetchActivities(accessToken, {
        startPage,
        apiLimitDaily: API_LIMIT_DAILY,
        apiLimitNow: API_LIMIT_NOW,
        numFetchesToday: metadata.NUM_FETCHES_TODAY,
        existingData: existingActivities,
    });

    // Update state
    metadata.LAST_PAGE_FETCHED = lastPageFetched;
    metadata.NUM_FETCHES_TODAY = (metadata.NUM_FETCHES_TODAY || 0) + fetchesDoneCount;
    metadata.LAST_FETCHED = Date.now();
    await metadataDocRef.set(metadata);

    // Save to storage
    await datastoreFile.save(JSON.stringify({
        metadata: {
            fetchedAt: Date.now(),
            partialFetch: interrupted,
            athlete: {
                id: athlete.id,
                name: `${athlete.firstname} ${athlete.lastname}`
            }
        },
        data: newData,
    }), {
        contentType: "application/json",
        resumable: false,
    });

    info(`Successfully saved ${newData.length} total activities. Interrupt status: ${interrupted}`);
}

export { retrieveAllData };
