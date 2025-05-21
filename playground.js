const fs = require('fs');
const secret = require('./secret.json');

secret.hello = 2;

fs.writeFile('secret.json', JSON.stringify(secret, null, 4), () => {

});