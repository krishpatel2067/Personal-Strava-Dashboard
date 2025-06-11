const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET
});

exports.helloWorld = onRequest((request, response) => {
    logger.info("Reading storage...", { structuredData: true });

    const bucket = admin.storage().bucket();
    const fileRef = bucket.file('test/MyTestNote.txt');

    fileRef.download().then(data => {
        logger.info(data[0]);
    })
    response.send("Hello from Firebase!");
});