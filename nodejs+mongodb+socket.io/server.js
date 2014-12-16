var mongo = require ('mongodb'),MongoClient,
    client = require('socket.io').listen(7001).sockets;
// collection chat
mongo.connect('mongodb://localhost/chat', function (err,db) {
    if (err) throw err;
    client.on('connection', function (socket) {
        var collection = db.collection('messages'),
        sendStatus = function (s) {
            socket.emit('status', s);
        };
        // enviar send das 100 últimas mensagens para todos os sockets abertos
        collection.find().limit(100).sort([['_id', 1]]).toArray(function (err,res){
            if (err) throw err;
            socket.emit('receive', res);
        });
        socket.on('send', function (data) {
            var name = data.name,
                message = data.message,
                whitespacePattern = /^\s*$/;
            if (whitespacePattern.test(name) || (whitespacePattern.test(message))) {
                sendStatus('nome e mensagem precisam ser preenchidos');
            } else {
                collection.insert({name:name, message:message}, function (){
                    // enviar ultima mensagem para todos os sockets
                    client.emit('receive', [data]);
                    sendStatus({
                        message: "Mensagem enviada",
                        clear: true
                    });
                });
            }
        });
    });
});
// simple webserver
var http = require('http')
    url = require('url'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs');

var server = http.createServer( function(req, resp) {
    var pathname = url.parse(req.url).pathname;
    if (pathname == "/") pathname = "index.html";
    var filename = path.join(process.cwd(), './', pathname);

    fs.exists(filename, function(exists) {
        if (!exists) {
            resp.writeHead(404, {"Content-Type": "text/plain"});
            resp.write("404 Not Found");
            resp.end();
            return;
        }
        resp.writeHead(200, {'Content-Type': mime.lookup(filename)});
        fs.createReadStream(filename, {
            'flags': 'r',
            'encoding': 'binary',
            'mode': 0666,
            'bufferSize': 4 * 1024
        }).addListener("data", function(chunk) {
            resp.write(chunk, 'binary');
        }).addListener("close",function() {
            resp.end();
        });
    });
}).listen(7002);
