const fetch = require('cross-fetch');
const { getDownloadURL } = require("firebase-admin/storage");

exports.getFileDownloadURL = async (bucket, filePath) => {
    // Use 'process.env.FUNCTIONS_EMULATOR === "true"' to check your environment.
    // Make sure that "true" is surrounded by quotes because it is a string, not a boolean.
    if (process.env.FUNCTIONS_EMULATOR === "true") {
        // Running using emulators.
        // You can find the bucket in the storage emulator suite.
        // Your bucket name should look something like this: <gs://your-app-name.appspot.com/>.
        return await getEmulatorDownloadURL(bucket, filePath);
    } else {
        // Running in production.
        const fileRef = getStorage().bucket().file(filePath);
        const fileUri = await getDownloadURL(fileRef);
        return fileUri;
    }
};

/**
 * Asynchronously generates and returns the download URL for a file in a specified Firebase Storage emulator bucket.
 * The generated URL can be used to download the file.
 *
 * @param {string} bucket - The name of the Firebase Storage emulator bucket.
 * @param {string} filePath - The path to the file inside the bucket.
 * @returns {Promise<string>} - A promise that resolves to the download URL as a string.
 */
const getEmulatorDownloadURL = async (bucket, filePath) => {
    // fetch a new download token
    const tokenGenerationFetch = await fetch(
        `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${bucket}/o/${encodeURIComponent(
            filePath,
        )}?create_token=true`,
        {
            method: 'POST',
            headers: {
                Authorization: 'Bearer owner',
            },
        },
    );
    const tokenGenerationResponse = await tokenGenerationFetch.json();
    console.log(tokenGenerationResponse)
    const downloadToken = tokenGenerationResponse.downloadTokens.split(',')[0];

    // manually construct the emulator download url
    return `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${bucket}/o/${encodeURIComponent(
        filePath,
    )}?alt=media&token=${downloadToken}`;
};