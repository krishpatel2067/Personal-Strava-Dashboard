let http = require('http');
let url = require('url');

let server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Hello from the other side!!');
    res.write(req.url);
    let q = url.parse(req.url, true).query;
    let text = q.year + ' ' + q.month;
    res.end(text);
});

server.listen(8080);