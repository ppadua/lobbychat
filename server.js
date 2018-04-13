var express = require( "express");
var path = require("path");
var app = express();

app.use(express.static(path.join(__dirname, "./assets")));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
     res.render("index");
})

var server = app.listen(3000, function() {
    console.log("listening on port 3000");
});


var io = require('socket.io',{ rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] }).listen(server);
var users = [];
var chat_rooms = [];

io.sockets.on('connection', function (socket) {
    socket.on("new_user", function(data){
        data.id = socket.id;
        users.push(data);
        socket.username = data.name;
        io.emit("welcome_new_user", users);
        socket.emit("user_create_room", data);
        socket.emit("all_room", chat_rooms);
    });

    socket.on("new_room", function(data){
        data.room_id = Date.now();
        chat_rooms.push(data);
        socket.room = data.room_id;
        socket.join(data.room_id);
        io.emit("show_room", data);
        socket.emit("enter_room", data);
        socket.emit('enter_chat_room', data);
        socket.emit('update_chat_room', data, ' has successfully created the chat room', true, socket.room);
    });

    socket.on("user_enter_room", function(room_id){
        var index = chat_rooms.findIndex(x => x.room_id == room_id);

        if(chat_rooms[index].room_password == ""){
            chat_rooms[index].roomlist.push({id : socket.id, name : socket.username});
            socket.room = room_id;
            socket.join(room_id);
            socket.broadcast.emit('update_chat_room', {id : socket.id, name : socket.username}, ' has joined the chat room', false, socket.room);
            socket.emit('enter_chat_room', chat_rooms[index]);
            io.emit('update_chat_user_list', chat_rooms[index]);
            io.emit('update_room_count', chat_rooms[index]);
        }
        else
            socket.emit('enter_room_password', chat_rooms[index]);
        
    });

    socket.on("user_message", function(message){
        io.emit("show_message", socket.username, message, socket.room);
    })

    socket.on("leave_room", function(){
        var chat_room_index = chat_rooms.findIndex(x => x.room_id == socket.room);
        var user_chat_room_index = chat_rooms[chat_room_index].roomlist.findIndex(x => x.id == socket.id);

        chat_rooms[chat_room_index].roomlist.splice(user_chat_room_index, 1);
        socket.broadcast.emit('disconnected_chat_room', {id : socket.id, name : socket.username}, ' has left the chat room', chat_rooms[chat_room_index]);
      
        io.emit('update_chat_user_list', chat_rooms[chat_room_index]);
        io.emit('update_room_count', chat_rooms[chat_room_index]);

        socket.emit('leave_chat_room', socket.room);
        socket.leave(socket.room);
        socket.room = "";

        if(chat_rooms[chat_room_index].roomlist.length == 0){
            chat_rooms.splice(chat_room_index, 1);
        }
    });

    socket.on("success_enter_room", function(room_id){
        var index = chat_rooms.findIndex(x => x.room_id == room_id);

        chat_rooms[index].roomlist.push({id : socket.id, name : socket.username});
        socket.room = room_id;
        socket.join(room_id);
        socket.broadcast.emit('update_chat_room', {id : socket.id, name : socket.username}, ' has joined the chat room', false, socket.room );
        socket.emit('enter_chat_room', chat_rooms[index]);
        io.emit('update_chat_user_list', chat_rooms[index]);
        io.emit('update_room_count', chat_rooms[index]);
    });

    socket.on('disconnect', function () {
        var index = users.findIndex(x => x.id == socket.id);
        if(index != -1){
            if(chat_rooms.length != 0){
                var chat_room_index = chat_rooms.findIndex(x => x.room_id == socket.room);
                var user_chat_room_index = chat_rooms[chat_room_index].roomlist.findIndex(x => x.id == socket.id);
               
               socket.broadcast.emit('disconnected_chat_room', {id : socket.id, name : socket.username}, ' has left the chat room', chat_rooms[chat_room_index]);
                chat_rooms[chat_room_index].roomlist.splice(user_chat_room_index, 1);
                io.emit('update_room_count', chat_rooms[chat_room_index]);

                if(chat_rooms[chat_room_index].roomlist.length == 0)
                    chat_rooms.splice(chat_room_index, 1);
            }

            socket.broadcast.emit("disconnected_user", socket.id);
            users.splice(index, 1);
        }
    });
});
