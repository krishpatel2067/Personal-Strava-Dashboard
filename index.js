const express = require('express');
const fetchData = require('./fetch.js');
const app = express();

app.listen(8080, () => console.log('listening to port 8080: http://localhost:8080/'));
app.use(express.static('public'));
app.get('/api', async (req, res) => {
    if (req.url === '/api?forceCache=true') {
        console.log('Mode: force cache. Getting cached data...');
        const cache = fetchData.getCachedData();

        if (cache.status !== 'Unsuccessful') {
            res.json(cache);
            console.log('Sent cached data.');
        } else {
            res.status(401).json({ error: 'CacheNotFound' });
            console.log('Sent error message.');
        }
        
        res.end();
    } else {
        console.log('Mode: default. Getting data...');
        const data = await fetchData.getData();
        res.json(data);
        console.log('Sent data.');
        res.end();
    }

    let response = await fetch('http://localhost:5000/api/python');
    let analysis = await response.json();
    console.log(analysis);
});