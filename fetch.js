import secret from './secret.json' with { type: "json" };

async function fetchData() {
    let params = new URLSearchParams();
    params.append('client_id', secret.CLIENT_ID);
    params.append('redirect_uri', 'http://127.0.0.1:5500/authSuccess.html');
    params.append('response_type', 'code');
    params.append('approval_prompt', 'force');
    params.append('scope', 'activity:read_all');
    let url = `https://www.strava.com/oauth/authorize?${params.toString()}`;
    let authWindow = window.open(url);

    const authWindowClosedInterval = await setInterval(async () => {
        if (authWindow.closed) {
            clearInterval(authWindowClosedInterval);
            const authParams = new URLSearchParams(authWindow.location.search);
            const authCode = authParams.get('code');

            if (authCode) {
                console.log('Authorization code received.');
                secret.AUTH_CODE = authCode;

                params = new URLSearchParams();
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
                secret.ATHLETE = resJson.athlete;
                
                params = new URLSearchParams();
                params.append('client_id', secret.CLIENT_ID);
                params.append('client_secret', secret.CLIENT_SECRET);
                params.append('grant_type', 'refresh_token');
                params.append('refresh_token', secret.REFRESH_TOKEN);

                response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
                    "method": "POST"
                });
                resJson = await response.json();
                secret.EXPIRES_AT = resJson.expires_at;
                secret.EXPIRES_IN = resJson.expires_in;
                secret.REFRESH_TOKEN = resJson.refresh_token;
                secret.ACCESS_TOKEN = resJson.access_token;
                console.log('Access token received!');
                
                response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${secret.ACCESS_TOKEN}`, {
                    "headers": {
                        "Authorization": `Bearer ${secret.ACCESS_TOKEN}`
                    }
                })
                resJson = await response.json();
                console.log('Data received!');
                document.getElementById('data').innerHTML = JSON.stringify(resJson);
            } else {
                throw new Error('Failed to get authorization code.');
            }
        }
    }, 500);
}

let fetchButton = document.getElementById('fetch-button');
fetchButton.addEventListener('click', fetchData);