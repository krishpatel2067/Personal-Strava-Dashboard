const path = require("path");
const fs = require("fs");
const data = require("./data.json").data;
const links = data.map((activity) => {
    return {
        name: activity.name,
        link: `https://www.strava.com/activities/${activity.id}`,
        date: activity.start_date,
    };
});
fs.writeFile(path.resolve(__dirname, "links.json"), JSON.stringify(links), (err) => {
    if (err) {
        console.log("Error while storing to links.json:", err.message);
    }
});