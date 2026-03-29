const express = require("express")
const router = express.Router()

const {
  startGame,
  negotiatePrice,
  saveScore,
  getLeaderboard
} = require("../controllers/gameController")

router.get("/start", startGame)
router.post("/negotiate", negotiatePrice)
router.post("/save-score", saveScore)
router.get("/leaderboard", getLeaderboard)

module.exports = router