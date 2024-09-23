// server.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
		credentials: true,
	},
});

app.get("/", (req, res) => {
	res.send("Hello World!");
});

let waitingUsers = [];

// 대기 중인 사용자 목록 업데이트 함수
const updateWaitingUsers = () => {
	const userIds = waitingUsers.map((user) => user.userId);
	io.emit("waitingListUpdate", userIds);
};

// 사용자를 매칭하는 함수
const matchUsers = () => {
	if (waitingUsers.length >= 2) {
		const user1 = waitingUsers.shift(); // 대기열에서 첫 번째 사용자 가져오기
		const user2 = waitingUsers.shift(); // 대기열에서 두 번째 사용자 가져오기

		if (user1 && user2) {
			console.log(`Matching ${user1.userId} with ${user2.userId}`);

			user1.emit("chatStarted", { peerId: user2.userId });
			user2.emit("chatStarted", { peerId: user1.userId });

			user1.peerId = user2.id;
			user2.peerId = user1.id;

			updateWaitingUsers(); // 대기 목록 업데이트
		}
	}
};

io.on("connection", (socket) => {
	socket.userId = uuidv4();
	socket.emit("yourId", socket.userId);
	console.log(`New client connected with id: ${socket.userId}`);

	// 유저가 매칭 대기열에 추가될 때
	socket.on("lookingForChat", () => {
		console.log(`User ${socket.userId} is looking for chat...`);
		// 이미 대기 중인 사용자가 중복 추가되지 않도록 확인
		if (!waitingUsers.some((user) => user.id === socket.id)) {
			waitingUsers.push(socket); // 대기열에 추가
			matchUsers(); // 매칭 시도
		}
		updateWaitingUsers(); // 대기 목록 업데이트
	});

	// 매칭 대기 취소 처리
	socket.on("cancelLookingForChat", () => {
		console.log(`User ${socket.userId} has canceled waiting.`);
		waitingUsers = waitingUsers.filter((user) => user.id !== socket.id); // 대기열에서 제거
		updateWaitingUsers(); // 대기 목록 업데이트
	});

	socket.on("sendMessage", (message) => {
		if (socket.peerId) {
			io.to(socket.peerId).emit("receiveMessage", message);
		}
	});

	// 연결 종료 시 처리
	socket.on("disconnectChat", () => {
		console.log(`${socket.userId} has left the chat.`);
		if (socket.peerId) {
			io.to(socket.peerId).emit("partnerDisconnected");
			const peerSocket = io.sockets.sockets.get(socket.peerId);
			if (peerSocket) {
				peerSocket.peerId = null;
			}
		}
		socket.peerId = null;
		waitingUsers = waitingUsers.filter((user) => user.id !== socket.id); // 대기열에서 제거
		updateWaitingUsers();
	});

	// 유저가 연결을 끊을 때 처리
	socket.on("disconnect", () => {
		console.log(`Client disconnected: ${socket.userId}`);
		waitingUsers = waitingUsers.filter((user) => user.id !== socket.id); // 대기열에서 제거
		updateWaitingUsers(); // 대기 목록 업데이트
	});

	// 상대방에게 입력 중 상태 전송
	socket.on("typing", () => {
		if (socket.peerId) {
			io.to(socket.peerId).emit("typing");
		}
	});

	// 상대방에게 입력 중 멈춤 상태 전송
	socket.on("stopTyping", () => {
		if (socket.peerId) {
			io.to(socket.peerId).emit("stopTyping");
		}
	});
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});
