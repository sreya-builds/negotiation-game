function Leaderboard({ leaderboard }) {
  return (
    <div className="leaderboard">
      {leaderboard.length === 0 ? (
        <p className="game-info">No scores yet. Be the first negotiator 🚀</p>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => {
            let badge = `#${index + 1}`

            if (index === 0) badge = "🥇"
            else if (index === 1) badge = "🥈"
            else if (index === 2) badge = "🥉"

            return (
              <div
                key={player._id || index}
                className={`leaderboard-item ${index === 0 ? "top-player" : ""}`}
              >
                <span>{badge}</span>
                <span>{player.playerName}</span>
                <span>₹{player.finalPrice}</span>
                <span>{player.roundsUsed} rounds</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Leaderboard