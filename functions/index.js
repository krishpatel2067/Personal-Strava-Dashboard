const { initializeApp, cert } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// env vars
const testVar = defineString("TEST_VAR");
const bucketVar = defineString("STORAGE_BUCKET");

const serviceAccount = require("./serviceAccountKey.json");
const app = initializeApp({
    credential: cert(serviceAccount),
});

exports.helloWorld = onRequest(async (request, response) => {
    logger.info("Reading storage...", { structuredData: true });
    logger.info(testVar.value());
    const bucket = getStorage(app).bucket(bucketVar.value());
    logger.info("after bucket");
    const fileRef = bucket.file("test/MyTestNote.txt");
    const fileRef3 = bucket.file("test/MyTestNote3.txt");
    logger.info("after fileRef");
    const url = await getDownloadURL(fileRef);
    const url3 = await getDownloadURL(fileRef3);
    logger.info("URL received!");
    logger.info(url);
    logger.info(url3);

    response.send("Hello from Firebase!");
});
