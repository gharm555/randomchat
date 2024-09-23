// src/components/MessageList.js
import React from "react";
import "./MessageList.css";

function MessageList({ messages, myId, typingMessage }) {
	return (
		<div className="message-list">
			{messages.map((message, index) => (
				<div
					key={index}
					className={`message ${
						message.senderId === myId ? "my-message" : "peer-message"
					}`}
				>
					{message.content}
				</div>
			))}

			{/* 상대방이 입력 중일 때 메시지처럼 표시 */}
			{typingMessage && <div className="typing-message">{typingMessage}</div>}
		</div>
	);
}

export default MessageList;
