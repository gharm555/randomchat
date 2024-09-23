const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: "http://localhost:3000", // 클라이언트 서버 주소
		methods: ["GET", "POST"],
		credentials: true,
	},
});

app.get("/", (req, res) => {
	res.send("Hello World!");
});

let waitingUsers = []; // 대기 중인 사용자를 저장할 배열

const updateWaitingUsers = () => {
	const userIds = waitingUsers.map((user) => user.userId);
	io.emit("waitingListUpdate", userIds); // 대기 중인 사용자 ID를 클라이언트에 브로드캐스트
};

const matchUsers = () => {
	if (waitingUsers.length >= 2) {
		const user1 = waitingUsers.shift();
		const user2 = waitingUsers.find((user) => user.id !== user1.id);

		if (user2) {
			waitingUsers = waitingUsers.filter((user) => user.id !== user2.id);

			user1.emit("chatStarted", { peerId: user2.userId });
			user2.emit("chatStarted", { peerId: user1.userId });

			user1.peerId = user2.id;
			user2.peerId = user1.id;

			updateWaitingUsers();
		} else {
			waitingUsers.push(user1);
		}
	}
};

io.on("connection", (socket) => {
	socket.userId = uuidv4();
	socket.emit("yourId", socket.userId);

	socket.on("lookingForChat", () => {
		waitingUsers.push(socket);
		matchUsers();
		updateWaitingUsers();
	});

	socket.on("sendMessage", (message) => {
		if (socket.peerId) {
			io.to(socket.peerId).emit("receiveMessage", message);
		}
	});

	socket.on("disconnectChat", () => {
		if (socket.peerId) {
			io.to(socket.peerId).emit("partnerDisconnected");

			const peerSocket = io.sockets.sockets.get(socket.peerId);
			if (peerSocket) {
				peerSocket.peerId = null;
			}
		}
		socket.peerId = null;
		waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);
		updateWaitingUsers();
	});

	socket.on("disconnect", () => {
		waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);
		updateWaitingUsers();
	});
});

server.listen(4000, () => {
	console.log("Listening on port 4000");
});
