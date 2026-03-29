const mongoose = require("mongoose")

const scoreSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
      trim: true
    },
    product: {
      type: String,
      required: true
    },
    finalPrice: {
      type: Number,
      required: true
    },
    roundsUsed: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Score", scoreSchema)