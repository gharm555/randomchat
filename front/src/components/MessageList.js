// src/components/MessageList.js

import React from "react";
import "./MessageList.css";

function MessageList({ messages, myId }) {
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
		</div>
	);
}

export default MessageList;
