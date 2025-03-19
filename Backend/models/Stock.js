const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemName: { type: String, required: true },
  quantityReceived: { type: Number, required: true },
  quantitySold: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  sellingPrice: { type: Number },
  week: { type: Number, required: true }, // Week number for tracking weekly stocks
  year: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Stock", stockSchema);
