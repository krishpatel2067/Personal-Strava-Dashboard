import secret from './secret.json' with { type: "json" };

let dataP = document.getElementById('data');

async function retrieveAuthCode(force) {
    if (secret.AUTH_CODE === undefined || force === true) {
        console.log('if (secret.AUTH_CODE === undefined || force === true)');
        let params = new URLSearchParams();
        params.append('client_id', secret.CLIENT_ID);
        params.append('redirect_uri', 'http://127.0.0.1:5500/authSuccess.html');
        params.append('response_type', 'code');
        params.append('approval_prompt', 'force');
        params.append('scope', 'activity:read_all');
        let url = `https://www.strava.com/oauth/authorize?${params.toString()}`;
        let authWindow = window.open(url);

        await new Promise(resolve => {
            const authWindowClosedInterval = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(authWindowClosedInterval);
                    const authParams = new URLSearchParams(authWindow.location.search);
                    const authCode = authParams.get('code');

                    if (authCode) {
                        console.log('Authorization code received.');
                        secret.AUTH_CODE = authCode;
                        resolve();
                    } else {
                        throw new Error('Failed to get authorization code.');
                    }
                }
            }, 500);
        });
    }

    return secret.AUTH_CODE;
}

async function retrieveAccessToken(forceAuthToken) {
    if (secret.REFRESH_TOKEN === undefined || forceAuthToken === true) {
        console.log('if (secret.REFRESH_TOKEN === undefined || forceAuthToken === true)');
        let authCode = await retrieveAuthCode(forceAuthToken);

        let params = new URLSearchParams();
        params.append('client_id', secret.CLIENT_ID);
        params.append('client_secret', secret.CLIENT_SECRET);
        params.append('code', authCode);
        params.append('grant_type', 'authorization_code');

        try {
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
        } catch (err) {
            if (forceAuthToken === true)
                throw new Error('Error in getting access token even after forcing a new auth token.');

            console.log('Error in getting access token: ' + err.message);
            console.log('Attempting to handle by getting a new auth token...')
            retrieveAccessToken(true);
        }
    }
    // if access token doesn't exist or it is going to expire in an hour
    else if (secret.EXPIRES_AT === undefined || secret.EXPIRES_AT - Date.now() / 1000 <= 3600) {
        console.log('else if (secret.EXPIRES_AT === undefined || secret.EXPIRES_AT - Date.now() / 1000 <= 3600)');
        let params = new URLSearchParams();
        params.append('client_id', secret.CLIENT_ID);
        params.append('client_secret', secret.CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', secret.REFRESH_TOKEN);

        let response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
            "method": "POST"
        });
        let resJson = await response.json();
        secret.EXPIRES_AT = resJson.expires_at;
        secret.EXPIRES_IN = resJson.expires_in;
        secret.REFRESH_TOKEN = resJson.refresh_token;
        secret.ACCESS_TOKEN = resJson.access_token;
        console.log('Access token received: ' + secret.ACCESS_TOKEN);
    }
    console.log("Access token expires on " + new Date(secret.EXPIRES_AT * 1000));
    return secret.ACCESS_TOKEN;
}

async function fetchData(forceAuthToken = false) {
    dataP.innerHTML = '';
    console.log('retrieveAccessToken(forceAuthToken);');
    let accessToken = await retrieveAccessToken(forceAuthToken);
    fetch(`https://www.strava.com/api/v3/athlete/activities?${accessToken}`, {
        "headers": {
            "Authorization": `Bearer ${accessToken}`
        }
    })
        .then(response => {
            if (response.status != 200) {
                if (forceAuthToken === true) {
                    throw new Error('Failed to fetch data.');
                }

                console.log('Error in fetching data: status code ' + response.status);
                console.log('Retrying by forcing auth token...');
                fetchData(true);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received!');
            dataP.innerHTML = JSON.stringify(data);
        })
        .catch(err => {
            console.log('Error in fetching data: ' + err);
        });
}

let fetchButton = document.getElementById('fetch-button');
fetchButton.addEventListener('click', fetchData);