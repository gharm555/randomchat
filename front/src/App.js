// src/App.js
import io from "socket.io-client";
import React, { useState, useEffect } from "react";
import ChatInput from "./components/ChatInput";
import MessageList from "./components/MessageList";
import "./App.css"; // 스타일을 위한 CSS 파일 임포트

const socket = io("http://localhost:4000");

function App() {
	const [messages, setMessages] = useState([]);
	const [peerId, setPeerId] = useState(null);
	const [myId, setMyId] = useState(null);
	const [isChatting, setIsChatting] = useState(false);
	const [matchTime, setMatchTime] = useState(""); // 매칭된 시간
	const [isLoading, setIsLoading] = useState(false);
	const [statusMessage, setStatusMessage] = useState(""); // 상태 메시지
	const [waitingList, setWaitingList] = useState([]); // 대기 사용자 목록
	const [typingMessage, setTypingMessage] = useState(""); // 입력 중 메시지

	// 매칭된 시간 설정 함수
	const getCurrentTime = () => {
		const padZero = (num) => (num < 10 ? "0" + num : num);
		const now = new Date();
		const formattedTime =
			now.getFullYear() +
			"-" +
			padZero(now.getMonth() + 1) +
			"-" +
			padZero(now.getDate()) +
			" " +
			padZero(now.getHours()) +
			":" +
			padZero(now.getMinutes()) +
			":" +
			padZero(now.getSeconds());
		return formattedTime;
	};

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
			setStatusMessage("매칭에 성공했습니다! 채팅을 시작하세요.");
			setMatchTime(getCurrentTime()); // 매칭된 시간 설정
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

		// 상대방이 입력 중인지 감지
		socket.on("typing", () => {
			setTypingMessage("상대방이 입력 중입니다...");
		});

		socket.on("stopTyping", () => {
			setTypingMessage("");
		});

		return () => {
			socket.off("yourId");
			socket.off("chatStarted");
			socket.off("receiveMessage");
			socket.off("partnerDisconnected");
			socket.off("waitingListUpdate");
			socket.off("typing");
			socket.off("stopTyping");
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
			socket.emit("stopTyping"); // 메시지 보내면 입력 중 상태를 멈춤
		} else {
			setStatusMessage("메시지를 보낼 상대가 없습니다.");
		}
	};

	const handleTyping = () => {
		socket.emit("typing"); // 입력 중 이벤트 전송
	};
	const handleStopTyping = () => {
		socket.emit("stopTyping"); // 입력 중 상태 해제
	};

	const handleDisconnectChat = () => {
		socket.emit("disconnectChat");
		setMessages([]);
		setPeerId(null);
		setIsChatting(false);
		setStatusMessage("연결을 종료했습니다.");
	};

	// 매칭 대기 취소
	const handleCancelWaiting = () => {
		setIsLoading(false);
		setStatusMessage("매칭이 취소되었습니다.");
		socket.emit("cancelLookingForChat");
	};

	return (
		<div className="chat-container">
			<h1>랜덤 채팅</h1>
			{/* 상태 메시지 표시 */}
			<p className="status-message">{statusMessage}</p>

			{/* 매칭된 시간 표시 */}
			{isChatting && <p className="status-message">매칭된 시간: {matchTime}</p>}

			<div className="chat-box">
				{/* 메시지 리스트와 typingMessage 전달 */}
				<MessageList
					messages={messages}
					myId={myId}
					typingMessage={typingMessage}
				/>

				{/* 대화 중인 상태가 아니면 대화 시작 버튼과 매칭 취소 버튼 표시 */}
				{!isChatting && (
					<div className="start-chat-section">
						<button onClick={handleStartChat} disabled={isLoading}>
							{isLoading ? "매칭 대기중..." : "대화 시작"}
						</button>

						{/* 로딩 상태일 때 매칭 취소 버튼 */}
						{isLoading && (
							<button onClick={handleCancelWaiting}>매칭 취소</button>
						)}
					</div>
				)}

				{/* 대화 중이면 채팅 입력창과 연결 종료 버튼 표시 */}
				{isChatting && (
					<div>
						<ChatInput
							onSendMessage={handleSendMessage}
							onTyping={handleTyping}
							onStopTyping={handleStopTyping} // 입력 중 해제
						/>

						<button onClick={handleDisconnectChat}>연결 종료</button>
					</div>
				)}
			</div>

			{/* 대기 중인 사용자 목록 표시 (디버깅용) */}
			<div className="waiting-list">
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
