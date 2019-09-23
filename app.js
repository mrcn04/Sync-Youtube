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
io.on('connection', function(socket) {

    // Buttons and Progress bar
    socket.on('event', function(msg){
        io.emit('event', msg);
        console.log(msg);
    }); 

    // username
    socket.on('new user', function(username){
        socket.username = username;
        io.emit('new user', username);
        console.log(username + ' connected');
        io.emit('connection2', "Welcome to Ömür's Chatbox " + username);  
        socket.on('disconnect', function(){
            console.log(username + ' disconnected');
          });
    });

    // chatbox
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    // // User connections
    // console.log('User ' + socket.username + ' Connected');
    // socket.on('disconnect', function(){
    //     console.log('User ' + socket.username + ' Disconnected');
    // });
});