const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  // email is stored for reference but should not be a unique indexed field
  // to avoid duplicate-key errors when multiple OTPs are generated rapidly.
  email: {
    type: String
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
