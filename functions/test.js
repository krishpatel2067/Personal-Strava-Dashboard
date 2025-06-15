const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");

exports.testFunc = async (app, bucketName) => {
    const bucket = getStorage(app).bucket(bucketName);
    logger.info("after bucket");
    const fileRef = bucket.file("test/MyTestNote.txt");
    const fileRef3 = bucket.file("test/MyTestNote3.txt");
    logger.info("after fileRef");
    const url = await getDownloadURL(fileRef);
    const url3 = await getDownloadURL(fileRef3);
    logger.info("URL received!");
    logger.info(url);
    logger.info(url3);
};
