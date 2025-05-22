const fs = require('fs');
let data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
console.log(data);
fs.writeFileSync('./data.json', JSON.stringify(data));