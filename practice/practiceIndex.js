let express = require('express');
let app = express();

app.listen(8080, () => console.log('listening at 8080'));
app.use(express.static('public'));
app.use(express.json({
    'limit': '1mb',
}));
app.post('/api', (req, res) => {
    console.log(req.body);
    res.json({
        status: 200,
        latitude: req.body.lat,
        longitude: req.body.lon,
    })
});