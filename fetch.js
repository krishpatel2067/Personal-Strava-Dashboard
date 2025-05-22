const fs = require('fs');

function retrieveAuthCode(force) {
    const secret = JSON.parse(fs.readFileSync('./secret.json', 'utf-8'));
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

async function retrieveAccessToken(forceUseAuthCode) {
    let secret = JSON.parse(fs.readFileSync('./secret.json', 'utf-8'));

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

        console.log('old access token: ' + secret.ACCESS_TOKEN);

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
    console.log('Access token expires on ' + new Date(secret.EXPIRES_AT * 1000));
    fs.writeFileSync('secret.json', JSON.stringify(secret, null, 4));
    return secret.ACCESS_TOKEN;
}

async function fetchData(perPage = 1, page = 1) {
    let accToken = await retrieveAccessToken();
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

async function getData() {
    // datastore has fields: { lastSaved: number, data: Object }
    const datastore = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

    if (datastore.lastSaved === undefined || Date.now() - datastore.lastSaved > 24 * 3600 * 1000) {
        // fetch new data
        console.log('Saved data is undated or is older than 1 day. Fetching new data...');
        let newData = [];
        let tempData = null;
        const perPage = 10;
        const maxPages = 1;            // -1 means all the pages that exist
        let page = 1;

        while (tempData == null || (tempData != null && tempData.length > 0)) {
            if (tempData != null) {
                console.log(`Page ${page - 1} data received.`);
                newData = newData.concat(tempData);
            }

            if (maxPages > 0 && page > maxPages)
                break;

            tempData = await fetchData(perPage, page++);
        }

        fs.writeFile('./data.json', JSON.stringify({ lastSaved: Date.now(), data: newData }), (err) => {
            if (err)
                throw err;
            else
                console.log('Successfully saved new data to data.json.');
        });
        return newData;
    } else {
        // use existing data
        console.log('Returning stored data from data.json.');
        return JSON.parse(JSON.stringify(datastore.data));
    }
}

module.exports = { retrieveAuthCode, retrieveAccessToken, getData };