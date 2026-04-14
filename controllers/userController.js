const EmailService = require("../config/email")
const bcrypt = require("bcrypt")
const { UserModel } = require("../models/user")
const { OtpModel } = require("../models/otp.model")

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: 60 * 60 * 1000, // 1 hour
};

//! Login 
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    // generate otp for login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashOtp = await bcrypt.hash(otp, 10);

  // remove previous OTPs for this email (avoid unique/index conflicts)
  await OtpModel.deleteMany({ email, type: "login" });
  // save new otp with type login
  await OtpModel.create({ userId: user._id, email, hashOtp, type: "login" });

    // send email with otp
    try {
      await EmailService(
        email,
        "Your Login OTP",
        `<div style="font-family:Arial;background:#f4f6f8;padding:20px;"><div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:30px;text-align:center;"><h2>Your Login OTP</h2><p>Enter this OTP to complete login:</p><div style="font-size:28px;letter-spacing:6px;font-weight:bold;background:#f1f3f5;padding:15px;border-radius:8px;width:220px;margin:auto;color:#dd2476;">${otp}</div><p>This OTP is valid for 5 minutes.</p></div></div>`
      );
    } catch (emailErr) {
      console.warn('Failed to send login OTP email:', emailErr && emailErr.message ? emailErr.message : emailErr);
      
      return res.status(200).json({ message: 'OTP generated but failed to send email' });
    }

    return res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error. please try again" });
  }
};

//! Register
const registerController = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await UserModel.create({ fullname, email, password: hashedPassword });

    const message = `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(90deg,#0f2027,#203a43,#2c5364); color:white; padding:20px; text-align:center;">
            <h1 style="margin:0;">🚀 Welcome to Habit & Mood Tracker</h1>
          </div>
          <div style="padding:30px; color:#333;">
            <h2>Hello ${fullname}, 👋</h2>
            <p>Your <b>registration was successful!</b> 🎉</p>
            <p>You can now log in and start using the app.</p>
            <p style="margin-top:30px;">Best regards,<br/><b>Team</b></p>
          </div>
          <div style="background:#f1f1f1; text-align:center; padding:15px; font-size:12px; color:#777;">© 2026 Habit & Mood Tracker</div>
        </div>
      </div>
    `;

    try {
      await EmailService(email, "Registration Successful", message);
    } catch (emailErr) {
      console.warn('Registration email failed:', emailErr && emailErr.message ? emailErr.message : emailErr);
      return res.status(201).json({ message: 'Registered but failed to send welcome email', userId: result._id });
    }

    return res.status(201).json({ message: "Register successfully", userId: result._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error. please try again" });
  }
};

//! Update 
const updateController = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, age, email, gender, city } = req.body;

    if (!username || !age || !email || !gender || !city) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await UserModel.updateOne(
      { _id: id },
      { $set: { username, age, email, gender, city } }
    );

    const updateUser = await UserModel.findById(id)

    res.status(200).json({ message: "User updated successfully", updateUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error. please try again" });
  }
}

//! Delete
const deleteController = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await UserModel.deleteOne({ _id: id });

    res.status(200).json({ message: "User deleted successfully", result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error. please try again" });
  }
}



//! forgot password
const forgotPasswordController = async (req, res) => {
  try {
    const email = req.body?.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // generate otp
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // hash otp
    const hashOtp = await bcrypt.hash(otp, 10);

    // delete old otp
    await OtpModel.findOneAndDelete({ userId: user._id });

    // save new otp
    await OtpModel.create({
      userId: user._id,
      hashOtp
    });

    // send email
    try {
      await EmailService(
        email,
        "Password Reset OTP",
        `
      <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:30px;text-align:center;">
          
          <h2>🔐 Password Reset OTP</h2>

          <p>Use this OTP to reset your password:</p>

          <div style="
            font-size:28px;
            letter-spacing:6px;
            font-weight:bold;
            background:#f1f3f5;
            padding:15px;
            border-radius:8px;
            width:220px;
            margin:auto;
            color:#dd2476;">
            ${otp}
          </div>

          <p>This OTP is valid for 5 minutes.</p>

          <a href="http://localhost:5173/verify-otp?email=${email}"
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 25px;
              background:#dd2476;
              color:white;
              text-decoration:none;
              border-radius:6px;">
              Verify OTP
          </a>

          <p style="margin-top:25px;">Team Nasa 🚀</p>
        </div>
      </div>
      `
      );
    } catch (emailErr) {
      console.warn('Forgot password email failed:', emailErr && emailErr.message ? emailErr.message : emailErr);
      return res.status(200).json({ message: 'OTP generated but failed to send email' });
    }

    res.status(200).json({
      message: "OTP sent to email successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message
    });
  }
};

//! Verify
const verifyotpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpPresent = await OtpModel.findOne({ userId: user._id });
    if (!otpPresent) {
      return res.status(404).json({ message: "OTP not found" });
    }

    const isMatch = await bcrypt.compare(otp, otpPresent.hashOtp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // if OTP type is login, issue JWT and set cookie
    if (otpPresent.type === "login") {
      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY || "secret", { expiresIn: "1h" });

      // delete used otp
      await OtpModel.findByIdAndDelete(otpPresent._id);

      // set cookie
      res.cookie("token", token, cookieOptions);

      return res.status(200).json({ message: "OTP verified, login successful" });
    }

    // default behaviour for reset OTP: delete and respond
    await OtpModel.findByIdAndDelete(otpPresent._id);
    res.status(200).json({ message: "OTP verified successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//! Reset Password
const updatePasswordController = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await UserModel.updateOne(
      { email },
      { $set: { password: hashPassword } }
    );

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//! Update profile (fullname, email) for authenticated user
const updateProfileController = async (req, res) => {
  try {
    const userId = req.id || req.body.userId; // prefer id from middleware
    const { fullname, email } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!fullname || !email) return res.status(400).json({ message: 'fullname and email required' });

    const existing = await UserModel.findOne({ email });
    if (existing && existing._id.toString() !== userId.toString()) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    await UserModel.updateOne({ _id: userId }, { $set: { fullname, email } });
    const updated = await UserModel.findById(userId);
    res.status(200).json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}


//! Logout 
const logoutController = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { registerController, loginController, updateController, forgotPasswordController, verifyotpController, updatePasswordController, deleteController, logoutController, updateProfileController }
