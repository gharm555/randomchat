// src/components/ChatInput.js
import React, { useState } from "react";

function ChatInput({ onSendMessage, onTyping, onStopTyping }) {
	const [message, setMessage] = useState("");

	const handleChange = (e) => {
		setMessage(e.target.value);
		onTyping(); // 입력 중일 때 실행
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (message.trim()) {
			onSendMessage(message);
			setMessage(""); // 메시지를 전송하면 입력 필드를 비움
			onStopTyping(); // 메시지를 보내면 입력 중 상태를 멈춤
		}
	};

	// 입력창을 벗어나면 "입력 중" 상태 해제
	const handleBlur = () => {
		onStopTyping(); // 포커스를 벗어나면 입력 중 상태 해제
	};

	return (
		<form onSubmit={handleSubmit} className="chat-input">
			<input
				type="text"
				placeholder="메시지를 입력하세요"
				value={message}
				onChange={handleChange}
				onBlur={handleBlur} // 포커스 해제 시 실행
			/>
			<button type="submit">전송</button>
		</form>
	);
}

export default ChatInput;
