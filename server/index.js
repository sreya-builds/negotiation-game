const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/database")
const gameRoutes = require("./routes/gameRoutes")

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.json({
    message: "Negotiation Game API is running"
  })
})

app.use("/api/game", gameRoutes)

app.listen(5000, () => {
  console.log(`Server running on port 5000`)
})