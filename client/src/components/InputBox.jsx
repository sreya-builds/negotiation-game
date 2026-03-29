
function InputBox({ input, setInput, sendMessage, gameOver }) {
  return (
    <div className="input-box modern-input-box">
      <input
        type="text"
        placeholder="Type your offer... e.g. 3400"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={gameOver}
      />

      <button
        onClick={sendMessage}
        disabled={gameOver}
        className="primary-btn send-btn"
      >
        Send
      </button>
    </div>
  )
}

export default InputBox