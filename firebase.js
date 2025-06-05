// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

require('dotenv').config();

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const storage = getStorage();
const storageRef = ref(storage, 'test/MyTestNote.txt');
getDownloadURL(storageRef).then(url => {
    console.log(url);
});
uploadBytes(
    ref(storage, 'test/UploadedTestNote.txt'),
    new Blob(["hello", "world"], {
        type: "text/plain"
    })
).then(snapshot => {
    console.log('success!!!');
    console.log(snapshot);
}).catch(err => {
    console.log('err!!!');
    console.log(err);
})