const socket = io();
let game = new Chess();
let board = null;
let playerColor = null;
let currentRoom = null;

function createRoom() {
  const roomId = document.getElementById('roomIdInput').value.trim();
  if (!/^[0-9]{4}$/.test(roomId)) return alert('Room ID must be 4 digits');
  socket.emit('createRoom', roomId);
  currentRoom = roomId;
  document.getElementById('roomName').textContent = roomId;
}

function toggleRoomVisibility() {
  if (currentRoom) {
    socket.emit('toggleVisibility', currentRoom);
  }
}

function joinRoom(roomId) {
  socket.emit('joinRoom', roomId);
  document.getElementById('gameArea').style.display = 'block';
  document.getElementById('roomName').textContent = roomId;
}

function onDragStart(source, piece) {
  if (game.game_over() || piece[0] !== playerColor[0] || game.turn() !== playerColor[0]) return false;
}

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';
  socket.emit('move', { roomId: currentRoom, move });
  updateStatus();
}

function onMouseoverSquare(square) {
  const moves = game.moves({ square, verbose: true });
  if (moves.length === 0) return;
  highlightSquare(square);
  moves.forEach(m => highlightSquare(m.to));
}

function onMouseoutSquare() {
  removeHighlights();
}

function highlightSquare(square) {
  const squareEl = $('#board .square-' + square);
  squareEl.addClass('highlight-square');
}

function removeHighlights() {
  $('#board .square-55d63').removeClass('highlight-square');
}

function updateStatus() {
  document.getElementById('status').textContent = 'Turn: ' + game.turn().toUpperCase();
}

socket.on('assignColor', color => {
  playerColor = color;
  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    orientation: color === 'w' ? 'white' : 'black',
    onDragStart,
    onDrop,
    onMouseoutSquare,
    onMouseoverSquare
  });
  updateStatus();
});

socket.on('opponentMove', move => {
  game.move(move);
  board.position(game.fen());
  updateStatus();
});

socket.on('roomList', rooms => {
  const list = document.getElementById('roomListUl');
  list.innerHTML = '';
  rooms.forEach(room => {
    const li = document.createElement('li');
    li.textContent = room;
    li.onclick = () => joinRoom(room);
    list.appendChild(li);
  });
});
