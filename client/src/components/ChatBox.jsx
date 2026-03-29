function ChatBox({ messages }) {
  return (
    <div className="chat-box">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.sender}`}>
          <span className="bubble">{msg.text}</span>
        </div>
      ))}
    </div>
  )
}

export default ChatBox