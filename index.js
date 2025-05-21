const fetch = require('./fetch.js');

fetch.fetchData()
    .then((result) => {
        console.log(result.response);
        console.log(result.data);
    });