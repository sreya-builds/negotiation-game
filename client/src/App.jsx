import { useEffect, useState } from "react"
import "./index.css"
import ChatBox from "./components/ChatBox"
import InputBox from "./components/InputBox"
import Leaderboard from "./components/Leaderboard"
import { MAX_ROUNDS, extractOffer } from "./utils/negotiation"

function App() {
  const [playerName, setPlayerName] = useState("")
  const [nameSubmitted, setNameSubmitted] = useState(false)

  const [listedPrice, setListedPrice] = useState(5000)
  const [product, setProduct] = useState("Product")
  const [sellerType, setSellerType] = useState("")
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [round, setRound] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [finalPrice, setFinalPrice] = useState(null)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [offerHistory, setOfferHistory] = useState([])
  const [messageHistory, setMessageHistory] = useState([])
  const [aiTyping, setAiTyping] = useState(false)

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/game/leaderboard")
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.log("Failed to fetch leaderboard:", error)
    }
  }

  const fetchGameData = async (name) => {
    try {
      setLoading(true)

      const response = await fetch("http://localhost:5000/api/game/start")
      const data = await response.json()

      setProduct(data.product)
      setListedPrice(data.listedPrice)
      setSellerType(data.sellerType)

      setMessages([
        {
          sender: "ai",
          text: `Hey ${name}! ${data.message}`
        }
      ])

      setRound(1)
      setGameOver(false)
      setInput("")
      setFinalPrice(null)
      setScoreSaved(false)
      setOfferHistory([])
      setMessageHistory([])
      setAiTyping(false)
    } catch (error) {
      console.log("Failed to fetch game data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const handleNameSubmit = () => {
    if (!playerName.trim()) return
    setNameSubmitted(true)
    fetchGameData(playerName)
    fetchLeaderboard()
  }

  const restartGame = () => {
    fetchGameData(playerName)
    fetchLeaderboard()
  }

  const handleNewUser = () => {
    setPlayerName("")
    setNameSubmitted(false)
    setMessages([])
    setInput("")
    setRound(1)
    setGameOver(false)
    setLoading(false)
    setFinalPrice(null)
    setScoreSaved(false)
    setOfferHistory([])
    setMessageHistory([])
    setAiTyping(false)
    setSellerType("")
    setProduct("Product")
    setListedPrice(5000)
    fetchLeaderboard()
  }

  const saveScoreToDB = async (dealPrice, roundsUsed) => {
    try {
      if (!playerName.trim()) return

      await fetch("http://localhost:5000/api/game/save-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerName,
          product,
          finalPrice: dealPrice,
          roundsUsed
        })
      })

      setScoreSaved(true)
      fetchLeaderboard()
    } catch (error) {
      console.log("Failed to save score:", error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || gameOver || loading) return

    const userText = input.trim()
    const userOffer = extractOffer(userText)

    const userChatMessage = {
      sender: "user",
      text: userText
    }

    const previousOffers = [...offerHistory]
    const previousMessages = [...messageHistory]

    setMessages((prev) => [...prev, userChatMessage])
    setInput("")
    setMessageHistory((prev) => [...prev, userText])

    if (userOffer !== null) {
      setOfferHistory((prev) => [...prev, userOffer])
    }

    if (userOffer === null) {
      setAiTyping(true)

      setTimeout(() => {
        setAiTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `Please enter a numeric offer, ${playerName}.`
          }
        ])
      }, 400)

      return
    }

    try {
      setAiTyping(true)

      const response = await fetch("http://localhost:5000/api/game/negotiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          offer: userOffer,
          round,
          playerName,
          sellerType,
          userMessage: userText,
          previousOffers,
          previousMessages
        })
      })

      const data = await response.json()

      setTimeout(async () => {
        setAiTyping(false)

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply
          }
        ])

        if (data.gameOver) {
          setGameOver(true)
          setFinalPrice(data.acceptedPrice)

          if (data.acceptedPrice) {
            await saveScoreToDB(data.acceptedPrice, round)
          }
        } else {
          if (round >= MAX_ROUNDS) {
            setGameOver(true)
          } else {
            setRound((prev) => prev + 1)
          }
        }
      }, 500)
    } catch (error) {
      setAiTyping(false)
      console.log("Negotiation failed:", error)
    }
  }

  if (!nameSubmitted) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Negotiation Game 🧠💰</h1>
          <p className="auth-subtitle">Enter your name to start bargaining</p>

          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="name-input"
          />

          <button onClick={handleNameSubmit} className="primary-btn auth-btn">
            Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="dashboard-layout">
        <aside className="leaderboard-panel">
          <div className="panel-card sticky-card leaderboard-card">
            <div className="panel-header">
              <h2 className="panel-title">Top Negotiators</h2>
              <span className="panel-icon">🏆</span>
            </div>

            <p className="panel-subtitle">
              Lowest final price wins the board
            </p>

            <Leaderboard leaderboard={leaderboard} />
          </div>
        </aside>

        <main className="game-panel">
          <div className="panel-card game-card">
            <div className="game-header">
              <div>
                <h1 className="game-title">Negotix</h1>
                <p className="game-subtitle">
                  Outsmart the seller and close the lowest deal
                </p>
              </div>

              <p className="seller-badge">Seller Style: {sellerType}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Player</span>
                <span className="stat-value">{playerName}</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Product</span>
                <span className="stat-value">{product}</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Listed Price</span>
                <span className="stat-value">₹{listedPrice}</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Round</span>
                <span className="stat-value">
                  {Math.min(round, MAX_ROUNDS)} / {MAX_ROUNDS}
                </span>
              </div>
            </div>

            <div className="progress-block">
              <div className="progress-top">
                <span>Negotiation Progress</span>
                <span>
                  {Math.min(Math.round((round / MAX_ROUNDS) * 100), 100)}%
                </span>
              </div>

              <div className="progress-wrapper">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.min((round / MAX_ROUNDS) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="chat-section">
              <ChatBox messages={messages} />
            </div>

            {aiTyping && <p className="typing-indicator">AI is typing...</p>}

            {!gameOver && (
              <InputBox
                input={input}
                setInput={setInput}
                sendMessage={sendMessage}
                gameOver={gameOver || loading}
              />
            )}

            {finalPrice && (
              <div className="result-card">
                <h2>🎉 Deal Closed!</h2>
                <p>You bought it for</p>
                <h1>₹{finalPrice}</h1>
                <p className="result-sub">Lower price = better rank 🚀</p>
              </div>
            )}

            {scoreSaved && (
              <p className="game-info success-text">
                Score saved to leaderboard 🎉
              </p>
            )}

            {gameOver && (
              <div className="game-over-card">
                <h2>Game Over</h2>
                <p>
                  {finalPrice
                    ? "Nice negotiation. You can play again with the same user or start with a new one."
                    : "This round has ended. Try again with the same user or let a new player start."}
                </p>

                <div className="game-over-actions">
                  <button onClick={restartGame} className="primary-btn">
                    Play Again
                  </button>

                  <button onClick={handleNewUser} className="secondary-btn">
                    New User
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App