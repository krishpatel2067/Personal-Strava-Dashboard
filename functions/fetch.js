import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { info, warn } from "firebase-functions/logger";

import path from "path";
import { readFile } from "fs/promises";

const MAX_PER_PAGE = 200;       // Strava's max page size is 200
const API_LIMIT = 750;          // Strava's read limit is 1000, but try to stay under
const DS_FILE = "data.json";
const DS_FILE_PATH = `private/${DS_FILE}`;

const SECRET_DB_ID = "strava-data-analysis-secret";
const SECRET_COLLEC_PATH = "secret";
const SECRET_DOC_PATH = `${SECRET_COLLEC_PATH}/secret`;

// function for local emulator
async function initFirestore(secretDb) {
    try {
        const secretJsonPath = path.join(process.cwd(), "secret.json");
        const secretLocal = JSON.parse(await readFile(secretJsonPath, "utf-8"));
        const docRef = secretDb.doc(SECRET_DOC_PATH);
        await docRef.set(secretLocal);
        info("Firestore initialized with local secret.json");
    } catch (err) {
        info("Error while initializing Firestore:");
        warn(err.message);
    }
}

async function retrieveAccessToken(secretDb, forceUseAuthCode = false, showExpDateMsg = true) {
    const docRef = secretDb.doc(SECRET_DOC_PATH);
    const secret = (await docRef.get()).data();

    if (secret.REFRESH_TOKEN === undefined || forceUseAuthCode === true) {
        info("Using auth code to grant access token.");

        if (secret.AUTH_CODE === undefined) {
            throw new Error("Error in retrieving access token: auth code not defined.");
        }

        info("Using auth code: " + secret.AUTH_CODE);

        const params = new URLSearchParams();
        params.append("client_id", secret.CLIENT_ID);
        params.append("client_secret", secret.CLIENT_SECRET);
        params.append("code", secret.AUTH_CODE);
        params.append("grant_type", "authorization_code");

        const response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            "method": "POST",
        });
        const resJson = await response.json();
        secret.EXPIRES_AT = resJson.expires_at;
        secret.EXPIRES_IN = resJson.expires_in;
        secret.REFRESH_TOKEN = resJson.refresh_token;
        secret.ACCESS_TOKEN = resJson.access_token;
        secret.ATHLETE = resJson.athlete;
        info("Access token received: " + secret.ACCESS_TOKEN);
        info("Refresh token: " + secret.REFRESH_TOKEN);
    } else if (secret.EXPIRES_AT === undefined || secret.EXPIRES_AT - Date.now() / 1000 <= 3600) {
        // if access token doesn't exist or it is going to expire in an hour
        info("Access token does not exist, or it is already expired or will expire in 1 hour.");

        if (secret.EXPIRES_AT !== undefined) {
            info("Access token expires at: " + new Date(secret.EXPIRES_AT * 1000));
        }

        info("Old access token: " + secret.ACCESS_TOKEN);

        const params = new URLSearchParams();
        params.append("client_id", secret.CLIENT_ID);
        params.append("client_secret", secret.CLIENT_SECRET);
        params.append("refresh_token", secret.REFRESH_TOKEN);
        params.append("grant_type", "refresh_token");

        const response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            method: "POST",
        });
        const resJson = await response.json();
        secret.EXPIRES_AT = resJson.expires_at;
        secret.EXPIRES_IN = resJson.expires_in;
        secret.REFRESH_TOKEN = resJson.refresh_token;
        secret.ACCESS_TOKEN = resJson.access_token;
        info("Access token received: " + secret.ACCESS_TOKEN);
        info("Refresh token: " + secret.REFRESH_TOKEN);
    }
    if (showExpDateMsg === true) {
        info("Access token expires on " + new Date(secret.EXPIRES_AT * 1000));
    }
    // write to secretDb
    docRef.set(secret).then(res => {
        info(`New secret stored in Firestore at ${res.writeTime.toDate()}`);
    });
    return secret.ACCESS_TOKEN;
}

async function fetchData(secretDb, perPage = 1, page = 1, showExpDateMsg = true) {
    const accToken = await retrieveAccessToken(secretDb, false, showExpDateMsg);
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accToken}`,
        },
    });

    // 429 - Too many requests
    if (response.status === 429) {
        return [{ status: 429 }, {}];
    } else {
        const data = await response.json();
        return [{ status: response.status }, data];
    }
}

async function retrieveAllData(app, bucketName, forceNew = false) {
    // Use default database in emulator if multi-db isn't supported
    console.log(process.env);
    const dbId = process.env.FUNCTIONS_EMULATOR ? undefined : SECRET_DB_ID;
    const secretDb = getFirestore(app, dbId);
    await initFirestore(secretDb);

    // datastore has fields: { fetchedAt: number, data: Object }
    const bucket = getStorage(app).bucket(bucketName);
    const datastoreFile = bucket.file(DS_FILE_PATH);
    let datastore = null;
    const exists = await datastoreFile.exists().catch(err => {
        info("Error checking whether datastore exists:");
        warn(err.message);
    });

    if (exists[0] === true) {
        info(`Datastore found at ${DS_FILE_PATH}`);

        const url = await getDownloadURL(datastoreFile).catch(err => {
            info("Error while getting datastore's download URL:");
            warn(err.message);
        });
        const res = await fetch(url).catch(err => {
            info("Error while fetching datastore:");
            warn(err.message);
        });
        datastore = await res.json().catch(err => {
            info("Error while converting fetched datastore to JSON:");
            warn(err.message);
        });
    } else {
        info(`Datastore does not exist at ${DS_FILE_PATH}`);
    }

    if (datastore === null || datastore.fetchedAt === undefined || Date.now() - datastore.fetchedAt > 24 * 3600 * 1000 || forceNew === true) {
        // fetch new data
        info("(Datastore not found) or (saved data is undated or older than 1 day) or (`forceNew` is true). Fetching new data...");

        // check API limit for today
        const docRef = secretDb.doc(SECRET_DOC_PATH);
        const secret = (await docRef.get()).data();

        const now = new Date(Date.now());
        let lastFetched = new Date(secret.LAST_FETCHED === undefined ? Date.now() : secret.LAST_FETCHED);
        let numFetchesSoFar = null;

        if (lastFetched.getUTCDate() == now.getUTCDate() && lastFetched.getUTCMonth() == now.getUTCMonth() && lastFetched.getUTCFullYear() == now.getUTCFullYear()) {
            // same day
            numFetchesSoFar = secret.NUM_FETCHES_TODAY === undefined ? 0 : secret.NUM_FETCHES_TODAY;
        } else {
            numFetchesSoFar = 0;
        }

        info("Last fetched: " + new Date(lastFetched));
        info("Num fetches today: " + numFetchesSoFar);

        // fetch all data to conserve API requests
        const perPage = MAX_PER_PAGE;
        const maxPages = -1;                      // -1 means all the pages that exist
        const apiLimitNow = 15;                   // prevent excessive API use at once

        let newData = [];
        let tempData = null;

        let page = (secret.LAST_PAGE_FETCHED === undefined || secret.LAST_PAGE_FETCHED === -1) ?
            1 : secret.LAST_PAGE_FETCHED + 1;
        let numEntriesGot = 0;
        let numFetchesNow = 0;
        let numFetchesToday = numFetchesSoFar;
        let showExpDateMsg = true;
        let interrupted = false;

        // keep fetching until empty pages are returned
        while (tempData == null || (tempData != null && tempData.length > 0)) {
            if (numFetchesNow > apiLimitNow || numFetchesToday > API_LIMIT) {
                info(`Preset daily API limit of ${API_LIMIT} or now API limit of ${apiLimitNow} reached. No more data will be fetched. If you were expecting data, try increasing the \`apiLimitNow\` variable.`);
                interrupted = true;
                break;
            }

            if (tempData != null) {
                // according to Strava API, # of entries per page may sometimes be less than requested
                const pageSize = tempData.length;
                info(`Page ${page - 1}, entries ${numEntriesGot}-${numEntriesGot + pageSize - 1} received.`);
                numEntriesGot += pageSize;
                newData = newData.concat(tempData);
            }

            if (maxPages > 0 && page > maxPages) {
                break;
            }

            const [response, dataJson] = await fetchData(secretDb, perPage, page, showExpDateMsg);

            if (response.status === 429) {
                info("Status code 429 - too many requests. Aborting fetch...");
                interrupted = true;
                break;
            } else {
                tempData = dataJson;
            }

            lastFetched = Date.now();
            page++;
            numFetchesNow++;
            numFetchesToday++;
            showExpDateMsg = false;
        }

        info("New last fetched date: " + new Date(lastFetched));
        info("Num fetches now: " + numFetchesNow);
        info("Num fetches today: " + numFetchesToday);

        secret.LAST_FETCHED = lastFetched;
        secret.NUM_FETCHES_TODAY = numFetchesToday;
        secret.LAST_PAGE_FETCHED = interrupted ? page - 1 : -1;

        // write secret to Firestore
        docRef.set(secret).then(res => {
            info(`New fetch times stored in Firestore at ${res.writeTime.toDate()}`);
        });

        datastoreFile.save(JSON.stringify({
            metadata: {
                fetchedAt: Date.now(),
            },
            data: newData,
        }), {
            contentType: "application/json",
        })
            .then(() => {
                info(`New datastore uploaded successfully to ${DS_FILE_PATH}`);

                getDownloadURL(datastoreFile)
                    .then(url => {
                        info("Datastore download URL:");
                        info(url);
                    })
                    .catch(err => {
                        info(`Failed to get download URL for the new datastore ${DS_FILE_PATH}: `);
                        warn(err.message);
                    });
            })
            .catch(err => {
                info(`Error in uploading datastore to ${DS_FILE_PATH}`);
                warn(err.message);
            });
    } else {
        info("Fetch of new data denied: either set `forceNew` to true or wait for at least 24 hours from the last fetch of new data.");
    }
}

export { retrieveAllData };
