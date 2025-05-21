const express = require('express');
const fetch = require('./fetch.js');
const app = express();

app.listen(8080, () => console.log('listening to port 8080: http://localhost:8080/'));
app.use(express.static('public'));
app.get('/api', async (req, res) => {
    console.log('fetching data');
    const [response, data] = await fetch.fetchData();
    res.send(data);
    console.log('sent data');
    res.end();
});