const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");

const fs = require("fs");
const path = require("path");
const MAX_PER_PAGE = 200;       // Strava's max page size is 200
const API_LIMIT = 750;          // Strava's read limit is 1000, but try to stay under
const DS_FILE = 'data.json';
const DS_FILE_PATH = `private/${DS_FILE}`;

const secretJsonPath = path.join(__dirname, "secret.json");

async function retrieveAccessToken(forceUseAuthCode = false, showExpDateMsg = true) {
    let secret = JSON.parse(fs.readFileSync(secretJsonPath, "utf-8"));

    if (secret.REFRESH_TOKEN === undefined || forceUseAuthCode === true) {
        logger.info("Using auth code to grant access token.");

        if (secret.AUTH_CODE === undefined)
            throw new Error("Error in retrieving access token: auth code not defined.");

        logger.info("Using auth code: " + secret.AUTH_CODE);

        let params = new URLSearchParams();
        params.append("client_id", secret.CLIENT_ID);
        params.append("client_secret", secret.CLIENT_SECRET);
        params.append("code", secret.AUTH_CODE);
        params.append("grant_type", "authorization_code");

        let response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            "method": "POST"
        });
        let resJson = await response.json();
        secret.EXPIRES_AT = resJson.expires_at;
        secret.EXPIRES_IN = resJson.expires_in;
        secret.REFRESH_TOKEN = resJson.refresh_token;
        secret.ACCESS_TOKEN = resJson.access_token;
        secret.ATHLETE = resJson.athlete;
        logger.info("Access token received: " + secret.ACCESS_TOKEN);
        logger.info("Refresh token: " + secret.REFRESH_TOKEN);
    }
    // if access token doesn't exist or it is going to expire in an hour
    else if (secret.EXPIRES_AT === undefined || secret.EXPIRES_AT - Date.now() / 1000 <= 3600) {
        logger.info("Access token does not exist, or it is already expired or will expire in 1 hour.");

        if (secret.EXPIRES_AT !== undefined)
            logger.info("Access token expires at: " + new Date(secret.EXPIRES_AT * 1000));

        logger.info("Old access token: " + secret.ACCESS_TOKEN);

        let params = new URLSearchParams();
        params.append("client_id", secret.CLIENT_ID);
        params.append("client_secret", secret.CLIENT_SECRET);
        params.append("refresh_token", secret.REFRESH_TOKEN);
        params.append("grant_type", "refresh_token");

        let response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            method: "POST"
        });
        let resJson = await response.json();
        secret.EXPIRES_AT = resJson.expires_at;
        secret.EXPIRES_IN = resJson.expires_in;
        secret.REFRESH_TOKEN = resJson.refresh_token;
        secret.ACCESS_TOKEN = resJson.access_token;
        logger.info("Access token received: " + secret.ACCESS_TOKEN);
        logger.info("Refresh token: " + secret.REFRESH_TOKEN);
    }
    if (showExpDateMsg === true)
        logger.info("Access token expires on " + new Date(secret.EXPIRES_AT * 1000));
    fs.writeFileSync(secretJsonPath, JSON.stringify(secret, null, 4));
    return secret.ACCESS_TOKEN;
}

async function fetchData(perPage = 1, page = 1, showExpDateMsg = true) {
    let accToken = await retrieveAccessToken(false, showExpDateMsg);
    let response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accToken}`
        }
    });

    // 429 - Too many requests
    if (response.status === 429) {
        return [{status: 429}, {}];
    } else {
        const data = await response.json();
        return [{status: response.status}, data];
    }
}

async function retrieveAllData(app, bucketName, forceNew = false) {
    // datastore has fields: { lastSaved: number, data: Object }
    const bucket = getStorage(app).bucket(bucketName);
    const datastoreFile = bucket.file(DS_FILE_PATH);
    let datastore = null;
    const exists = await datastoreFile.exists().catch(err => {
        logger.info("Error checking whether datastore exists:");
        logger.warn(err.message);
    });

    if (exists[0] === true) {
        logger.info(`Datastore found at ${DS_FILE_PATH}`)
        
        const url = await getDownloadURL(datastoreFile).catch(err => {
            logger.info("Error while getting datastore's download URL:");
            logger.warn(err.message);
        });
        const res = await fetch(url).catch(err => {
            logger.info("Error while fetching datastore:");
            logger.warn(err.message);
        });
        datastore = await res.json().catch(err => {
            logger.info("Error while converting fetched datastore to JSON:");
            logger.warn(err.message);
        });
    } else {
        logger.info(`Datastore does not exist at ${DS_FILE_PATH}`)
    }

    if (datastore === null || datastore.lastSaved === undefined || Date.now() - datastore.lastSaved > 24 * 3600 * 1000 || forceNew === true) {
        // fetch new data
        logger.info("(Datastore not found) or (saved data is undated or older than 1 day) or (`forceNew` is true). Fetching new data...");

        // check API limit for today
        let secret = JSON.parse(fs.readFileSync(secretJsonPath, "utf-8"));

        let now = new Date(Date.now());
        let lastFetched = new Date(secret.LAST_FETCHED === undefined ? Date.now() : secret.LAST_FETCHED);
        let numFetchesSoFar = null;

        if (lastFetched.getUTCDate() == now.getUTCDate() && lastFetched.getUTCMonth() == now.getUTCMonth() && lastFetched.getUTCFullYear() == now.getUTCFullYear()) {
            // same day
            numFetchesSoFar = secret.NUM_FETCHES_TODAY === undefined ? 0 : secret.NUM_FETCHES_TODAY;
        } else {
            numFetchesSoFar = 0;
        }

        logger.info("Last fetched: " + new Date(lastFetched));
        logger.info("Num fetches today: " + numFetchesSoFar);

        // fetch all data to conserve API requests
        const perPage = MAX_PER_PAGE;
        const maxPages = 2;            // -1 means all the pages that exist

        let newData = [];
        let tempData = null;

        let page = 1;
        let numEntriesGot = 0;
        let numFetchesNow = 0;
        let numFetchesToday = numFetchesSoFar;
        let showExpDateMsg = true;
        let apiLimitNow = 10;                   // prevent excessive API use at once

        // keep fetching until empty pages are returned
        while ((tempData == null || (tempData != null && tempData.length > 0))) {
            if (numFetchesNow > apiLimitNow || numFetchesToday > API_LIMIT) {
                logger.info(`Preset daily API limit of ${API_LIMIT} or now API limit of ${apiLimitNow} reached. No more data will be fetched. If you were expecting data, try increasing the \`apiLimitNow\` variable.`);
                break;
            }

            if (tempData != null) {
                // according to Strava API, # of entries per page may sometimes be less than requested
                let pageSize = tempData.length;
                logger.info(`Page ${page - 1}, entries ${numEntriesGot}-${numEntriesGot + pageSize - 1} received.`);
                numEntriesGot += pageSize;
                newData = newData.concat(tempData);
            }

            if (maxPages > 0 && page > maxPages)
                break;

            const [response, dataJson] = await fetchData(perPage, page, showExpDateMsg);

            if (response.status === 429) {
                logger.log("Status code 429 - too many requests. Aborting fetch...");
                return;
            } else {
                tempData = dataJson;
            }

            lastFetched = Date.now();
            page++;
            numFetchesNow++;
            numFetchesToday++;
            showExpDateMsg = false;
        }

        logger.info("New last fetched date: " + new Date(lastFetched));
        logger.info("Num fetches now: " + numFetchesNow);
        logger.info("Num fetches today: " + numFetchesToday);

        secret.LAST_FETCHED = lastFetched;
        secret.NUM_FETCHES_TODAY = numFetchesToday;

        fs.writeFileSync(secretJsonPath, JSON.stringify(secret, null, 4));

        datastoreFile.save(JSON.stringify({ lastSaved: Date.now(), data: newData }), {
            contentType: "application/json"
        })
            .then(() => {
                logger.log(`New datastore uploaded successfully to ${DS_FILE_PATH}`);

                getDownloadURL(datastoreFile)
                    .then(url => {
                        logger.log("Datastore download URL:");
                        logger.log(url);
                    })
                    .catch(err => {
                        logger.info(`Failed to get download URL for the new datastore ${DS_FILE_PATH}: `);
                        logger.warn(err.message);
                    });
            })
            .catch(err => {
                logger.log(`Error in uploading datastore to ${DS_FILE_PATH}`);
                logger.warn(err.message);
            });
    } else {
        logger.info("Fetch of new data denied: either set `forceNew` to true or wait for at least 24 hours from the last fetch of new data.");
    }
}

module.exports = { retrieveAllData };
