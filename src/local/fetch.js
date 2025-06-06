const fs = require('fs');
const path = require('path');
const MAX_PER_PAGE = 200;       // Strava's max page size is 200
const API_LIMIT = 750;          // Strava's read limit is 1000, but try to stay under

const secretJsonPath = path.join(__dirname, 'secret.json');
const dataJsonPath = path.join(__dirname, 'data.json');

function retrieveAuthCode(force) {
    const secret = JSON.parse(fs.readFileSync(secretJsonPath, 'utf-8'));
    if (secret.AUTH_CODE === undefined || force === true) {
        let params = new URLSearchParams();
        params.append('client_id', secret.CLIENT_ID);
        params.append('redirect_uri', 'http://127.0.0.1:5500/authSuccess.html');
        params.append('response_type', 'code');
        params.append('approval_prompt', 'force');
        params.append('scope', 'activity:read_all');

        let url = `https://www.strava.com/oauth/authorize?${params.toString()}`;
        console.log('Please visit this URL to authenticate:');
        console.log(url);
    }
}

async function retrieveAccessToken(forceUseAuthCode = false, showExpDateMsg = true) {
    let secret = JSON.parse(fs.readFileSync(secretJsonPath, 'utf-8'));

    if (secret.REFRESH_TOKEN === undefined || forceUseAuthCode === true) {
        console.log('Using auth code to grant access token.');

        if (secret.AUTH_CODE === undefined)
            throw new Error('Error in retrieving access token: auth code not defined.');

        console.log('Using auth code: ' + secret.AUTH_CODE);

        let params = new URLSearchParams();
        params.append('client_id', secret.CLIENT_ID);
        params.append('client_secret', secret.CLIENT_SECRET);
        params.append('code', secret.AUTH_CODE);
        params.append('grant_type', 'authorization_code');

        let response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            "method": "POST"
        });
        let resJson = await response.json();
        secret.EXPIRES_AT = resJson.expires_at;
        secret.EXPIRES_IN = resJson.expires_in;
        secret.REFRESH_TOKEN = resJson.refresh_token;
        secret.ACCESS_TOKEN = resJson.access_token;
        secret.ATHLETE = resJson.athlete;
        console.log('Access token received: ' + secret.ACCESS_TOKEN);
        console.log('Refresh token: ' + secret.REFRESH_TOKEN);
    }
    // if access token doesn't exist or it is going to expire in an hour
    else if (secret.EXPIRES_AT === undefined || secret.EXPIRES_AT - Date.now() / 1000 <= 3600) {
        console.log('Access token does not exist, or it is already expired or will expire in 1 hour.');

        if (secret.EXPIRES_AT !== undefined)
            console.log('Access token expires at: ' + new Date(secret.EXPIRES_AT * 1000));

        console.log('Old access token: ' + secret.ACCESS_TOKEN);

        let params = new URLSearchParams();
        params.append('client_id', secret.CLIENT_ID);
        params.append('client_secret', secret.CLIENT_SECRET);
        params.append('refresh_token', secret.REFRESH_TOKEN);
        params.append('grant_type', 'refresh_token');

        let response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            method: 'POST'
        });
        let resJson = await response.json();
        secret.EXPIRES_AT = resJson.expires_at;
        secret.EXPIRES_IN = resJson.expires_in;
        secret.REFRESH_TOKEN = resJson.refresh_token;
        secret.ACCESS_TOKEN = resJson.access_token;
        console.log('Access token received: ' + secret.ACCESS_TOKEN);
        console.log('Refresh token: ' + secret.REFRESH_TOKEN);
    }
    if (showExpDateMsg === true)
        console.log('Access token expires on ' + new Date(secret.EXPIRES_AT * 1000));
    fs.writeFileSync(secretJsonPath, JSON.stringify(secret, null, 4));
    return secret.ACCESS_TOKEN;
}

async function fetchData(perPage = 1, page = 1, showExpDateMsg = true) {
    let accToken = await retrieveAccessToken(false, showExpDateMsg);
    let response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accToken}`
        }
    });

    const data = await response.json();
    console.log('Data received!');
    return data;
}

async function getData(numEntries = 10) {
    // datastore has fields: { lastSaved: number, data: Object }
    const datastore = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
    let data = null;

    if (datastore.lastSaved === undefined || Date.now() - datastore.lastSaved > 24 * 3600 * 1000) {
        // fetch new data
        console.log('Saved data is undated or is older than 1 day. Fetching new data...');

        // check API limit for today
        let secret = JSON.parse(fs.readFileSync(secretJsonPath, 'utf-8'));

        let now = new Date(Date.now());
        let lastFetched = new Date(secret.LAST_FETCHED === undefined ? Date.now() : secret.LAST_FETCHED);
        let numFetchesSoFar = null;

        if (lastFetched.getUTCDate() == now.getUTCDate() && lastFetched.getUTCMonth() == now.getUTCMonth() && lastFetched.getUTCFullYear() == now.getUTCFullYear()) {
            // same day
            numFetchesSoFar = secret.NUM_FETCHES_TODAY === undefined ? 0 : secret.NUM_FETCHES_TODAY;
        } else {
            numFetchesSoFar = 0;
        }

        console.log('Last fetched: ' + new Date(lastFetched));
        console.log('Num fetches today: ' + numFetchesSoFar);

        // fetch all data to conserve API requests
        const perPage = MAX_PER_PAGE;
        const maxPages = -1;            // -1 means all the pages that exist

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
                console.log(`Preset API limit of ${apiLimit} reached. No more data will be fetched.`);
                break;
            }

            if (tempData != null) {
                // according to Strava API, # of entries per page may sometimes be less than requested
                let pgSz = tempData.length;
                console.log(`Page ${page - 1}, entries ${numEntriesGot}-${numEntriesGot + pgSz - 1} received.`);
                numEntriesGot += tempData.length;
                newData = newData.concat(tempData);
            }

            if (maxPages > 0 && page > maxPages)
                break;

            tempData = await fetchData(perPage, page++, showExpDateMsg);
            lastFetched = Date.now();
            numFetchesNow++;
            numFetchesToday++;
            showExpDateMsg = false;
        }

        console.log('New last fetched: ' + new Date(lastFetched));
        console.log('Num fetches now: ' + numFetchesNow);
        console.log('Num fetches today: ' + numFetchesToday);

        secret.LAST_FETCHED = lastFetched;
        secret.NUM_FETCHES_TODAY = numFetchesToday;

        fs.writeFile(secretJsonPath, JSON.stringify(secret, null, 4), (err) => {
            if (err)
                throw err;
        });

        fs.writeFile(dataJsonPath, JSON.stringify({ lastSaved: Date.now(), data: newData }), (err) => {
            if (err)
                throw err;
            else
                console.log('Successfully saved new data to data.json.');
        });

        data = newData;
    } else {
        // use existing data
        console.log('Returning stored data from data.json.');
        data = JSON.parse(JSON.stringify(datastore.data));
    }

    if (numEntries > data.length)
        console.log(`More entries requested than are available. Returning all ${data.length} entries.`);

    // NOT NECESSARY ANYMORE - TODELETE
    // return only what is requested
    return data.slice(0, numEntries);
}

// NOT NECESSARY ANYMORE - TODELETE
// function to temporarily get the stored data only
function getCachedData(numEntries = 10) {
    console.log('Returning stored data from data.json without checking for updated data.');
    // in case datastore doesn't exist, etc.
    try {
        const datastore = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
        let data = JSON.parse(JSON.stringify(datastore.data));
        return data.slice(0, numEntries);
    } catch (err) {
        console.log('Error: ' + err.message);
        return {status: 'Unsuccessful'};
    }
}

module.exports = { retrieveAuthCode, retrieveAccessToken, getData, getCachedData };