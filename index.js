const express = require('express');
const fetch = require('./fetch.js');
const app = express();

app.listen(8080, () => console.log('listening to port 8080: http://localhost:8080/'));
app.use(express.static('public'));
app.get('/api', async (req, res) => {
    if (req.url === '/api?forceCache=true') {
        console.log('Mode: force cache. Getting cached data...');
        const cache = fetch.getCachedData();

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
        const data = await fetch.getData();
        res.json(data);
        console.log('Sent data.');
        res.end();
    }
});
// TODO: temp response while all new data being fetched (show cached while updated are loading, for better UX)