const socket = io();

let username = "";
let roomCode = "";
let messageElements = {};
let typingTimeout;

/* =====================
   THEME
===================== */
function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  document.getElementById("themeToggle").textContent =
    theme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const t = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("theme", t);
  applyTheme(t);
}

applyTheme(localStorage.getItem("theme") || "light");

/* =====================
   LANDING PAGE
===================== */
function showCreate() {
  roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  document.getElementById("landingPage").style.display = "none";
  document.getElementById("roomPage").style.display = "block";

  document.getElementById("roomCodeInput").value = roomCode;
}

function showJoin() {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("roomPage").style.display = "block";
}

/* =====================
   ENTER CHAT
===================== */
function enterChat() {
  username = document.getElementById("username").value.trim();
  roomCode = document.getElementById("roomCodeInput").value.trim();

  if (!username || !roomCode) {
    alert("Please enter your name and room code");
    return;
  }

  socket.emit("join", { name: username, roomCode });

  document.getElementById("roomPage").style.display = "none";
  document.getElementById("chatBox").style.display = "flex";

  document.getElementById("roomHeader").textContent = `Room: ${roomCode}`;

  const messageInput = document.getElementById("message");
  messageInput.focus();

  /* ✅ FIX: Enter key ONLY on input */
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  /* Typing indicator */
  messageInput.addEventListener("input", () => {
    socket.emit("typing", username);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping");
    }, 1000);
  });
}

/* =====================
   SEND MESSAGE
===================== */
function sendMessage() {
  const input = document.getElementById("message");
  if (!input.value.trim()) return;

  const id = Date.now();
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  socket.emit("chatMessage", {
    id,
    name: username,
    message: input.value,
    time
  });

  input.value = "";
}

/* =====================
   RECEIVE MESSAGE
===================== */
socket.on("chatMessage", (data) => {
  const chat = document.getElementById("chat");

  const msg = document.createElement("div");
  msg.classList.add(
    "message",
    data.name === username ? "my-message" : "other-message"
  );

  msg.innerHTML = `
    <strong>${data.name}</strong><br>
    ${data.message}
    <div class="time">${data.time}</div>
    <div class="status">✓ Sent</div>
  `;

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;

  messageElements[data.id] = msg;

  if (data.name !== username) {
    socket.emit("messageSeen", data.id);
  }
});

socket.on("messageSeen", (id) => {
  if (messageElements[id]) {
    messageElements[id].querySelector(".status").textContent = "✓✓ Seen";
  }
});

/* =====================
   USERS & SYSTEM EVENTS
===================== */
socket.on("onlineUsers", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.textContent = u;
    list.appendChild(li);
  });
});

socket.on("userJoined", (name) => {
  const div = document.createElement("div");
  div.textContent = `${name} joined`;
  div.className = "system";
  document.getElementById("chat").appendChild(div);
});

socket.on("userLeft", (name) => {
  const div = document.createElement("div");
  div.textContent = `${name} left`;
  div.className = "system";
  document.getElementById("chat").appendChild(div);
});

socket.on("typing", (name) => {
  if (name !== username) {
    document.getElementById("typing").textContent =
      `${name} is typing...`;
  }
});

socket.on("stopTyping", () => {
  document.getElementById("typing").textContent = "";
});
