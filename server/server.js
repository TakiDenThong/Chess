const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, '../client')));

const rooms = {};

io.on('connection', socket => {
  io.emit('roomList', Object.keys(rooms).filter(id => rooms[id].visible));

  socket.on('createRoom', roomId => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], visible: true };
    }
    if (rooms[roomId].players.length < 2) {
      rooms[roomId].players.push(socket);
      socket.join(roomId);
      socket.emit('assignColor', 'w');
      io.emit('roomList', Object.keys(rooms).filter(id => rooms[id].visible));
    }
  });

  socket.on('joinRoom', roomId => {
    if (rooms[roomId] && rooms[roomId].players.length === 1) {
      rooms[roomId].players.push(socket);
      socket.join(roomId);
      socket.emit('assignColor', 'b');
    }
  });

  socket.on('move', ({ roomId, move }) => {
    socket.to(roomId).emit('opponentMove', move);
  });

  socket.on('toggleVisibility', roomId => {
    if (rooms[roomId]) {
      rooms[roomId].visible = !rooms[roomId].visible;
      io.emit('roomList', Object.keys(rooms).filter(id => rooms[id].visible));
    }
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(s => s !== socket);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
    io.emit('roomList', Object.keys(rooms).filter(id => rooms[id].visible));
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
