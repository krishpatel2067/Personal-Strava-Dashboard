import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { info, warn } from "firebase-functions/logger";
import path from "path";
import { readFile } from "fs/promises";

import { getAccessToken } from "./lib/auth.js";
import { fetchActivities } from "./lib/activities.js";
import { getLoggedInAthlete, getStats } from "./lib/athlete.js";
import { getGear } from "./lib/gear.js";

const DS_FILE_PATH = "private/raw_data.json";
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
        const secretFields = ["CLIENT_ID", "CLIENT_SECRET", "AUTH_CODE", "REFRESH_TOKEN", "ACCESS_TOKEN", "EXPIRES_AT"];
        const secrets = secretFields.reduce((acc, field) => {
            if (secretLocal[field]) {
                acc[field] = secretLocal[field];
            }
            return acc;
        }, {});

        const metadataFields = ["LAST_PAGE_FETCHED", "NUM_FETCHES_TODAY", "LAST_FETCH_DATE", "LAST_FETCHED"];
        const metadata = metadataFields.reduce((acc, field) => {
            if (fetchMetadataLocal[field]) {
                acc[field] = fetchMetadataLocal[field];
            }
            return acc;
        }, {});

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
    const fetchStart = Date.now();
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
    const isOld = Date.now() - lastFetched > 24 * 3600 * 1000;      // is older than a day?

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

    // Fetch detailed athlete info & stats
    const athlete = await getLoggedInAthlete(accessToken);
    const athleteStats = await getStats(athlete.id, accessToken);

    // Fetch gear
    const gear = { shoes: [], bikes: [] };

    for (const shoe of athlete.shoes) {
        gear.shoes.push(await getGear(shoe.id, accessToken));
    }

    for (const bike of athlete.bikes) {
        gear.bikes.push(await getGear(bike.id, accessToken));
    }

    // Fetch activities
    const startPage = forceNew ? 1 : (metadata.LAST_PAGE_FETCHED || 0) + 1;
    const existingActivities = forceNew ? [] : datastore.data;

    const {
        data: newData,
        lastPageFetched,
        fetchesDoneCount,
        interrupted
    } = await fetchActivities(accessToken, {
        startPage,
        apiLimitDaily: 100,
        apiLimitNow: 1,
        perPage: 1,
        numFetchesToday: metadata.NUM_FETCHES_TODAY,
        existingData: existingActivities,
    });

    // Update state
    metadata.LAST_PAGE_FETCHED = lastPageFetched;
    metadata.NUM_FETCHES_TODAY = (metadata.NUM_FETCHES_TODAY || 0) + fetchesDoneCount;
    metadata.LAST_FETCHED = Date.now();
    await metadataDocRef.set(metadata);

    // Save to storage
    const fetchEnd = Date.now();
    await datastoreFile.save(JSON.stringify({
        metadata: {
            fetch_end: fetchEnd,
            fetch_duration: fetchEnd - fetchStart,
            partial_fetch: interrupted,
            processed: false
        },
        data: {
            athlete,
            athlete_stats: athleteStats,
            gear,
            activities: newData
        },
    }), {
        contentType: "application/json",
        resumable: false,
    });

    info(`Successfully saved ${newData.length} total activities. Interrupt status: ${interrupted}`);
}

export { retrieveAllData };
