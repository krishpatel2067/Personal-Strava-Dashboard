import { info } from "firebase-functions/logger";

const SECRET_DOC_PATH = "main/secret";

/**
 * Handles OAuth2 token retrieval and refresh logic.
 * Encapsulates management of access tokens, refresh tokens, and expirations.
 */
export async function getAccessToken(db) {
    const docRef = db.doc(SECRET_DOC_PATH);
    const snap = await docRef.get();
    if (!snap.exists) throw new Error("Secret document not found in Firestore.");

    const secret = snap.data();
    const nowInSeconds = Math.floor(Date.now() / 1000);

    // 1. Initial Authorization if no refresh token exists
    if (!secret.REFRESH_TOKEN) {
        if (!secret.AUTH_CODE) throw new Error("AUTH_CODE missing in secrets. Cannot authorize.");

        info("Exchanging AUTH_CODE for tokens...");
        const response = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: secret.CLIENT_ID,
                client_secret: secret.CLIENT_SECRET,
                code: secret.AUTH_CODE,
                grant_type: "authorization_code",
            }),
        });

        if (!response.ok) throw new Error(`OAuth exchange failed: ${response.statusText}`);
        const resJson = await response.json();

        Object.assign(secret, {
            EXPIRES_AT: resJson.expires_at,
            REFRESH_TOKEN: resJson.refresh_token,
            ACCESS_TOKEN: resJson.access_token,
            ATHLETE: resJson.athlete,
        });

        await docRef.set(secret);
        return secret.ACCESS_TOKEN;
    }

    // 2. Refresh Token if expired or expiring soon (within 10 mins)
    if (!secret.EXPIRES_AT || secret.EXPIRES_AT - nowInSeconds < 600) {
        info("Access token expired or expiring soon. Refreshing...");
        const response = await fetch("https://www.strava.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: secret.CLIENT_ID,
                client_secret: secret.CLIENT_SECRET,
                refresh_token: secret.REFRESH_TOKEN,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) throw new Error(`Token refresh failed: ${response.statusText}`);
        const resJson = await response.json();

        Object.assign(secret, {
            EXPIRES_AT: resJson.expires_at,
            REFRESH_TOKEN: resJson.refresh_token,
            ACCESS_TOKEN: resJson.access_token,
        });

        await docRef.set(secret);
        info("Access token refreshed effectively.");
    }

    return secret.ACCESS_TOKEN;
}
