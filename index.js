const dotenv = require('dotenv');
dotenv.config();

async function retrieveAuthCode(force) {
    if (process.env.AUTH_CODE === undefined || force === true) {
        console.log('if (process.env.AUTH_CODE === undefined || force === true)');
        let params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_ID);
        params.append('redirect_uri', 'http://127.0.0.1:5500/authSuccess.html');
        params.append('response_type', 'code');
        params.append('approval_prompt', 'force');
        params.append('scope', 'activity:read_all');

        let url = `https://www.strava.com/oauth/authorize?${params.toString()}`;
        console.log('Please visit this URL to authenticate:');
        console.log(url);
    }

    return process.env.AUTH_CODE;
}

async function retrieveAccessToken(forceUseAuthCode) {
    if (process.env.REFRESH_TOKEN === undefined || forceUseAuthCode === true) {
        console.log('Refresh token does not exist. Using auth code to grant access token.');

        if (process.env.AUTH_CODE === undefined)
            throw new Error('Error in retrieving access token: auth code not defined.');

        console.log('Using auth code: ' + process.env.AUTH_CODE);

        let params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_ID);
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('code', process.env.AUTH_CODE);
        params.append('grant_type', 'authorization_code');

        let response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            "method": "POST"
        });
        let resJson = await response.json();
        process.env.EXPIRES_AT = resJson.expires_at;
        process.env.EXPIRES_IN = resJson.expires_in;
        process.env.REFRESH_TOKEN = resJson.refresh_token;
        process.env.ACCESS_TOKEN = resJson.access_token;
        process.env.ATHLETE = resJson.athlete;
        console.log('Access token received: ' + process.env.ACCESS_TOKEN);
    }
    // if access token doesn't exist or it is going to expire in an hour
    else if (process.env.EXPIRES_AT === undefined || process.env.EXPIRES_AT - Date.now() / 1000 <= 3600) {
        console.log('Access token does not exist, or it is already expired or will expire in 1 hour.');

        if (process.env.EXPIRES_AT !== undefined)
            console.log('Access token expires at: ' + new Date(process.env.EXPIRES_AT * 1000));

        console.log('old access token: ' + process.env.ACCESS_TOKEN);

        let params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_ID);
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('refresh_token', process.env.REFRESH_TOKEN);
        params.append('grant_type', 'refresh_token');

        let response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            "method": "POST"
        });
        let resJson = await response.json();
        process.env.EXPIRES_AT = resJson.expires_at;
        process.env.EXPIRES_IN = resJson.expires_in;
        process.env.REFRESH_TOKEN = resJson.refresh_token;
        process.env.ACCESS_TOKEN = resJson.access_token;
        console.log('Access token received: ' + process.env.ACCESS_TOKEN);
    }
    console.log("Access token expires on " + new Date(process.env.EXPIRES_AT * 1000));
    return process.env.ACCESS_TOKEN;
}

async function fetchData() {
    let accToken = await retrieveAccessToken();
    console.log(accToken);
    let response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=1`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accToken}`
        }
    });
    let data = await response.json();
    console.log('Data received!');
    console.log(data);
}

// retrieveAuthCode(true);
fetchData();