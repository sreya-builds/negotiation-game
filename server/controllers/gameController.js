const Score = require("../models/Score")

const LISTED_PRICE = 5000
const MAX_ROUNDS = 5

const SELLER_PERSONALITIES = {
  friendly: {
    name: "Friendly Seller",
    minimumPrice: 3400,
    openingLine: "I like fair deals. Give me a good offer."
  },
  aggressive: {
    name: "Aggressive Seller",
    minimumPrice: 3700,
    openingLine: "I don't waste time on bad offers. Be serious."
  },
  smart: {
    name: "Smart Seller",
    minimumPrice: 3500,
    openingLine: "Convince me with a strong offer and good reasoning."
  },
  pressure: {
    name: "Pressure Seller",
    minimumPrice: 3600,
    openingLine: "This price may not stay for long. Make your move quickly."
  }
}

const getRandomSellerType = () => {
  const sellerTypes = Object.keys(SELLER_PERSONALITIES)
  const randomIndex = Math.floor(Math.random() * sellerTypes.length)
  return sellerTypes[randomIndex]
}

const detectTactic = (message = "") => {
  const text = message.toLowerCase()

  if (
    text.includes("student") ||
    text.includes("college") ||
    text.includes("learning")
  ) {
    return "student"
  }

  if (
    text.includes("please") ||
    text.includes("kindly") ||
    text.includes("can you") ||
    text.includes("would you")
  ) {
    return "polite"
  }

  if (
    text.includes("right now") ||
    text.includes("today") ||
    text.includes("immediately") ||
    text.includes("quickly")
  ) {
    return "urgent"
  }

  if (
    text.includes("leave") ||
    text.includes("walk away") ||
    text.includes("not buying") ||
    text.includes("another option")
  ) {
    return "walkAway"
  }

  if (
    text.includes("budget") ||
    text.includes("afford") ||
    text.includes("too expensive") ||
    text.includes("my limit")
  ) {
    return "budget"
  }

  return "normal"
}

const startGame = (req, res) => {
  const sellerType = getRandomSellerType()
  const seller = SELLER_PERSONALITIES[sellerType]

  res.json({
    product: "Wireless Headphones",
    listedPrice: LISTED_PRICE,
    maxRounds: MAX_ROUNDS,
    sellerType,
    message: `Welcome! This product costs ₹${LISTED_PRICE}. ${seller.openingLine}`
  })
}

const negotiatePrice = (req, res) => {
  const {
    offer,
    round,
    playerName,
    sellerType,
    userMessage,
    previousOffers = [],
    previousMessages = []
  } = req.body

  const seller = SELLER_PERSONALITIES[sellerType] || SELLER_PERSONALITIES.smart
  const minimumPrice = seller.minimumPrice
  const safePlayerName = playerName?.trim() || "Player"
  const tactic = detectTactic(userMessage)

  const lastOffer =
    previousOffers.length > 0
      ? previousOffers[previousOffers.length - 1]
      : null

  const repeatedSameOffer = lastOffer !== null && offer === lastOffer
  const improvedOffer = lastOffer !== null && offer > lastOffer
  const lowerThanBefore = lastOffer !== null && offer < lastOffer

  const repeatedPressureTactic =
    previousMessages.filter((msg) => {
      const text = msg.toLowerCase()
      return (
        text.includes("leave") ||
        text.includes("walk away") ||
        text.includes("another option")
      )
    }).length >= 2

  if (!offer) {
    return res.status(400).json({
      reply: "Please enter a valid offer",
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (round >= MAX_ROUNDS) {
    return res.json({
      reply: `Time's up, ${safePlayerName}. Negotiation closed.`,
      gameOver: true,
      acceptedPrice: null,
      tactic
    })
  }

  if (offer > LISTED_PRICE) {
    return res.json({
      reply: `${safePlayerName}, the listed price is ₹${LISTED_PRICE}. You don't need to offer more than that. Try negotiating at or below the listed price.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (offer === LISTED_PRICE) {
    return res.json({
      reply: `Fair enough, ${safePlayerName}. I can close the deal at the listed price of ₹${LISTED_PRICE}.`,
      gameOver: true,
      acceptedPrice: LISTED_PRICE,
      tactic
    })
  }

  if (repeatedSameOffer) {
    return res.json({
      reply: `${safePlayerName}, you've already offered ₹${offer} before. If you want this deal, improve your offer a little.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (lowerThanBefore) {
    return res.json({
      reply: `${safePlayerName}, your new offer is even lower than your last one. That won't help in this negotiation.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (improvedOffer && offer < minimumPrice) {
    return res.json({
      reply: `${safePlayerName}, that's better than your last offer. You're moving in the right direction, but I still need a bit more.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (repeatedPressureTactic && round >= 3) {
    return res.json({
      reply: `${safePlayerName}, you've already tried walking away more than once. Give me a serious number instead.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (offer >= minimumPrice) {
    let successReply = ""

    if (tactic === "student") {
      successReply = `${safePlayerName}, I usually don't go this low, but since you're a student, I can accept ₹${offer}.`
    } else if (tactic === "polite") {
      successReply = `You asked well, ${safePlayerName}. I can accept ₹${offer}.`
    } else if (tactic === "urgent") {
      successReply = `Quick deal, ${safePlayerName}. ₹${offer} works for me.`
    } else if (tactic === "walkAway") {
      successReply = `Alright ${safePlayerName}, before you leave, I'll accept ₹${offer}.`
    } else if (sellerType === "friendly") {
      successReply = `You negotiated nicely, ${safePlayerName}. I can do ₹${offer}.`
    } else if (sellerType === "aggressive") {
      successReply = `Fine ${safePlayerName}. ₹${offer} is acceptable, but that's my limit.`
    } else if (sellerType === "pressure") {
      successReply = `Quick move, ${safePlayerName}. ₹${offer} works. Deal closed.`
    } else {
      successReply = `Smart negotiation, ${safePlayerName}. I accept ₹${offer}.`
    }

    return res.json({
      reply: successReply,
      gameOver: true,
      acceptedPrice: offer,
      tactic
    })
  }

  if (tactic === "student" && offer >= minimumPrice - 300) {
    return res.json({
      reply: `${safePlayerName}, I understand you're a student. I still can't accept ₹${offer}, but I'll make it easier for you. Try a slightly better offer.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (tactic === "budget" && offer >= minimumPrice - 250) {
    return res.json({
      reply: `I understand your budget, ${safePlayerName}. You're close. Increase a little and we may have a deal.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (tactic === "walkAway" && round >= 3) {
    return res.json({
      reply: `${safePlayerName}, no need to walk away yet. Give me one better offer and I might close this.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  if (tactic === "urgent") {
    return res.json({
      reply: `${safePlayerName}, if you want a quick deal, come closer to my price and we can finish this now.`,
      gameOver: false,
      acceptedPrice: null,
      tactic
    })
  }

  const gap = minimumPrice - offer
  let reply = ""

  if (sellerType === "friendly") {
    if (gap >= 1000) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 300)
      reply = `${safePlayerName}, that's too low, but I can still offer ₹${counter}.`
    } else if (gap >= 500) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 350)
      reply = `You're getting closer, ${safePlayerName}. How about ₹${counter}?`
    } else {
      const counter = Math.max(minimumPrice, offer + 150)
      reply = `That's a fair try, ${safePlayerName}. If you can do ₹${counter}, it's yours.`
    }
  } else if (sellerType === "aggressive") {
    if (gap >= 1000) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 150)
      reply = `${safePlayerName}, that's not even close. Best I can do is ₹${counter}.`
    } else if (gap >= 500) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 200)
      reply = `Still low, ${safePlayerName}. ₹${counter}, final enough.`
    } else {
      const counter = Math.max(minimumPrice, offer + 250)
      reply = `You're almost there, ${safePlayerName}. ₹${counter} and we're done.`
    }
  } else if (sellerType === "pressure") {
    if (gap >= 1000) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 220)
      reply = `${safePlayerName}, too low. ₹${counter}. Decide fast.`
    } else if (gap >= 500) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 260)
      reply = `I can do ₹${counter}, but not for long, ${safePlayerName}.`
    } else {
      const counter = Math.max(minimumPrice, offer + 180)
      reply = `Last quick chance, ${safePlayerName}. ₹${counter} closes it now.`
    }
  } else {
    if (gap >= 1000) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 250)
      reply = `${safePlayerName}, that offer is too low. I can reduce it to ₹${counter}.`
    } else if (gap >= 500) {
      const counter = Math.max(minimumPrice, LISTED_PRICE - round * 300)
      reply = `You are getting closer, ${safePlayerName}. My counter is ₹${counter}.`
    } else {
      const counter = Math.max(minimumPrice, offer + 200)
      reply = `Serious offer, ${safePlayerName}. Let's close at ₹${counter}.`
    }
  }

  return res.json({
    reply,
    gameOver: false,
    acceptedPrice: null,
    tactic
  })
}

const saveScore = async (req, res) => {
  try {
    const { playerName, product, finalPrice, roundsUsed } = req.body

    if (!playerName || !product || !finalPrice || !roundsUsed) {
      return res.status(400).json({
        message: "All fields are required"
      })
    }

    const newScore = await Score.create({
      playerName,
      product,
      finalPrice,
      roundsUsed
    })

    res.status(201).json({
      message: "Score saved successfully",
      score: newScore
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to save score",
      error: error.message
    })
  }
}

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Score.find()
      .sort({ finalPrice: 1, roundsUsed: 1, createdAt: 1 })
      .limit(10)

    res.status(200).json({
      leaderboard
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leaderboard",
      error: error.message
    })
  }
}

module.exports = {
  startGame,
  negotiatePrice,
  saveScore,
  getLeaderboard
}