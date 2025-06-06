const express = require('express');
const fetchData = require('./fetch.js');
const app = express();

app.listen(8080, () => console.log('listening to port 8080: http://localhost:8080/'));
app.use(express.static('public'));
app.get('/api', async (req, res) => {
    if (req.url === '/api?forceCache=true') {
        console.log('Mode: force cache. Using cached data...');
    } else {
        console.log('Mode: default. Checking for new data...');
        await fetchData.getData();
    }

    let response = await fetch('http://localhost:5000/api/python');
    let analysis = await response.json();
    res.json(analysis);
    console.log('Sent data.');
    res.end();
});