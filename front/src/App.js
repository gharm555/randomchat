// src/App.js

import io from "socket.io-client";
import React, { useState, useEffect } from "react";
import ChatInput from "./components/ChatInput";
import MessageList from "./components/MessageList";
import "./App.css";

const socket = io("http://3.36.207.231:4000");

function App() {
	const [messages, setMessages] = useState([]);
	const [peerId, setPeerId] = useState(null);
	const [myId, setMyId] = useState(null);
	const [isChatting, setIsChatting] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [statusMessage, setStatusMessage] = useState("");
	const [waitingList, setWaitingList] = useState([]);

	useEffect(() => {
		socket.on("yourId", (id) => {
			setMyId(id);
		});

		socket.on("waitingListUpdate", (waitingUsers) => {
			setWaitingList(waitingUsers);
		});

		socket.on("chatStarted", (data) => {
			setPeerId(data.peerId);
			setIsChatting(true);
			setIsLoading(false);
			setStatusMessage("매칭에 성공했습니다! 상대방과 채팅을 시작하세요.");
		});

		socket.on("receiveMessage", (message) => {
			setMessages((prevMessages) => [...prevMessages, message]);
		});

		socket.on("partnerDisconnected", () => {
			setPeerId(null);
			setIsChatting(false);
			setMessages([]);
			setStatusMessage("상대방이 연결을 종료했습니다.");
		});

		return () => {
			socket.off("yourId");
			socket.off("chatStarted");
			socket.off("receiveMessage");
			socket.off("partnerDisconnected");
			socket.off("waitingListUpdate");
		};
	}, []);

	const handleStartChat = () => {
		setIsLoading(true);
		setStatusMessage("매칭 대기 중입니다...");
		socket.emit("lookingForChat");
	};

	const handleSendMessage = (newMessage) => {
		if (peerId) {
			const myMessage = {
				senderId: myId,
				content: newMessage,
			};
			setMessages((prevMessages) => [...prevMessages, myMessage]);
			socket.emit("sendMessage", myMessage);
		} else {
			setStatusMessage("메시지를 보낼 상대가 없습니다.");
		}
	};

	const handleDisconnectChat = () => {
		socket.emit("disconnectChat");
		setMessages([]);
		setPeerId(null);
		setIsChatting(false);
		setStatusMessage("연결을 종료했습니다.");
	};

	// 매칭 대기 취소 함수
	const handleCancelWaiting = () => {
		setIsLoading(false); // 매칭 대기 상태 해제
		setStatusMessage("매칭이 취소되었습니다.");
		socket.emit("cancelLookingForChat"); // 서버에 대기 취소 이벤트 전송
	};

	return (
		<div>
			<h1>랜덤 채팅</h1>
			{!isChatting ? (
				<>
					<button onClick={handleStartChat} disabled={isLoading}>
						{isLoading ? "매칭 대기중..." : "대화 시작"}
					</button>

					{/* 매칭 대기 중일 때 매칭 취소 버튼 */}
					{isLoading && (
						<>
							<div className="loading-spinner"></div>
							<button onClick={handleCancelWaiting}>매칭 취소</button>
						</>
					)}
				</>
			) : (
				<>
					<MessageList messages={messages} myId={myId} />
					<ChatInput onSendMessage={handleSendMessage} />
					<button onClick={handleDisconnectChat}>연결 종료</button>
				</>
			)}

			<p>{statusMessage}</p>

			{/* 대기 목록 표시 */}
			<div>
				<h3>대기 중인 사용자 목록:</h3>
				<ul>
					{waitingList.map((userId, index) => (
						<li key={index}>{userId}</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export default App;
