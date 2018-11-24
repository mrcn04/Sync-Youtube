// vars and consts
const express = require('express');
let app = express();
const port = process.env.PORT || 4000;
const http = require('http').Server(app);
const io = require('socket.io')(http);


// App setup
app.set("view engine", "ejs");
app.use(express.static("css"));  // Look up for css folder
app.use(express.static("socket.io"));  // Look up for socket.io folder
app.use(express.static(__dirname + '/public')); // Look up everything includes non folders

// Routes
// Home
app.get("/", function(req, res){
    res.render("home");
});

// No Content page
app.get("*", function(req, res){
    res.status(403);
    res.send("<h1> oppps </h1>");
});

// Port
http.listen(port, function(){
    console.log('listening on *: ' + port);
  });

// Socket setup
io.on('connection', function(socket){
    socket.on('event', function(msg){
        console.log(msg);
    }); 

    socket.on('chat message', function(msg, un){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
        io.emit('new user', un);
    });

    // username
    socket.on('new user', function(un){
        var un = un;
        socket.un = un;
        console.log(un + ' connected');
        io.emit('connection2', "Welcome to Ömür's Chatbox " + un);  
        socket.on('disconnect', function(){
            console.log('user disconnected');
            io.emit('disconnection', un + ' disconnected.');
          });
    });

    // User connections
    console.log('User ' + socket.id + ' Connected');
    socket.on('disconnect', function(){
        console.log('User ' + socket.id + ' Disconnected');
    });
    
});