"use strict";

/**
 * Module dependencies.
 */

var express, routes, v1, Player, BISON, app, io, Game, game, Enemy;

express = require('express');
routes  = require('./routes');
Game    = require('./model/game');
Player  = require('./model/player');
Enemy   = require('./model/enemy');
BISON   = require('bison');

app = module.exports = express.createServer();
io = require('socket.io').listen(app);

// Configuration
app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.listen(9696);

io.configure(function () {
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 1);                    // reduce logging
    io.set('transports', [                     // enable all transports (optional if you want flashsocket)
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
    ]);
});

var Kb = require('./model/keyboard');

var Keyboard = new Kb();

io.sockets.on('connection', function (socket) {

    socket.on('register', function (data) {
        game.players[socket.id] = new Player(socket.id, data);     // add the new player
        socket.emit("ID", socket.id);
    });

    socket.on('keyup', function (event) {
        var data = BISON.decode(event);
        if (game.players[data.id]) {
            game.players[data.id].end_move = game.unixTime();
            Keyboard.keyEvent(data.key, data.type, game.players[data.id]);
        }
    });

    socket.on('keydown', function (event) {
        var data = BISON.decode(event);
        if (game.players[data.id]) {
            game.players[data.id].start_move = game.unixTime();
            Keyboard.keyEvent(data.key, data.type, game.players[data.id]);
        }
    });

    socket.on('disconnect', function () {
        var that = this;
        io.sockets.emit('remove', that.id);
        delete game.players[this.id];
    });
});

var dataStream = [];
game = new Game();

var FPS = 200;

setInterval(function () {
    game.worker();

    dataStream[0] = game.getPlayers();
    dataStream[1] = game.getEnemies();

    io.sockets.emit('update', BISON.encode(dataStream));
}, 50);
