const fs = require('fs');
let secret = require('./secret.json');

function retrieveAuthCode(force) {
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

async function fetchData() {
    let accToken = await retrieveAccessToken();
    let response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=1', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accToken}`
        }
    });

    let data = await response.json();
    console.log('Data received!');
    return [response, data];
}

module.exports = { retrieveAuthCode, retrieveAccessToken, fetchData };