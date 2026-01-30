const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const roomUsers = {}; // { roomCode: [usernames] }

io.on("connection", (socket) => {
  let username = "";
  let room = "";

  socket.on("join", ({ name, roomCode }) => {
    username = name;
    room = roomCode;

    socket.join(room);

    if (!roomUsers[room]) roomUsers[room] = [];
    roomUsers[room].push(username);

    io.to(room).emit("userJoined", username);
    io.to(room).emit("onlineUsers", roomUsers[room]);
  });

  socket.on("chatMessage", (data) => {
    io.to(room).emit("chatMessage", data);
  });

  socket.on("messageSeen", (id) => {
    socket.to(room).emit("messageSeen", id);
  });

  socket.on("typing", (name) => {
    socket.to(room).emit("typing", name);
  });

  socket.on("stopTyping", () => {
    socket.to(room).emit("stopTyping");
  });

  socket.on("disconnect", () => {
    if (room && roomUsers[room]) {
      roomUsers[room] = roomUsers[room].filter(u => u !== username);
      io.to(room).emit("userLeft", username);
      io.to(room).emit("onlineUsers", roomUsers[room]);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
