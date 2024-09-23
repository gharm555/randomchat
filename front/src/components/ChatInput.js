// src/components/ChatInput.js

import React, { useState } from "react";
import "./ChatInput.css";

function ChatInput({ onSendMessage }) {
	const [message, setMessage] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (message.trim() !== "") {
			onSendMessage(message);
			setMessage("");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="chat-input">
			<input
				type="text"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				placeholder="메시지를 입력하세요"
			/>
			<button type="submit">전송</button>
		</form>
	);
}

export default ChatInput;
