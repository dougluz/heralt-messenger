const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  getRoomUsers,
  userLeave
} = require('./utils/users');
const botName = 'Admin';

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

// run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    socket.emit('message', formatMessage(botName, 'Welcome to chat-app'));
    // broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`
      ));

    // send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // listen for chatMessage
  socket.on('chatMessage', (message) => {
    const user = getCurrentUser(socket.id);
    console.log(user);
    io.emit('message', formatMessage(`${user.username}`, message));
  });

  // runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if(user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
      // send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));