const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  hashOtp: {
    type: String
  },
  type: {
    type: String,
    enum: ["reset", "login"],
    default: "reset"
  },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt:{
    type: Date,
    default: Date.now,
    expires: "5m"
  }
});

const OtpModel = mongoose.model("otp", otpSchema);

module.exports = { OtpModel };
