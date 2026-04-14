require("dotenv").config()
const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt")
const connectDB = require("./config/db")
const { UserModel } = require("./models/user")
const EmailService = require("./config/email")
const { loginController, registerController, updateController ,forgotPasswordController, verifyotpController, updatePasswordController, deleteController} = require("./controllers/userController")
const { logoutController, updateProfileController } = require("./controllers/userController")
const authentication = require("./middleware/authmidlleware")
const { createHabit, getHabits, deleteHabit, updateHabit } = require('./controllers/habitController')


const app = express()
const isProduction = process.env.NODE_ENV === "production";
const normalizeOrigin = (value = "") => value.trim().replace(/\/+$/, "");

const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:5173,https://sanctuarymoodtracker.netlify.app"
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin);

    // allow non-browser tools (no origin header) and allowed frontend domains
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200
}))


//! connect to DB and start server only after successful DB connection
connectDB()
    .then(() => {
        // apis

// app.get("/test", authentication  , (req, res) => {
    
//     res.status(200).json({ message: "API status is healthy" })
// })

app.get("/",(req,res)=>{
    res.status(200).json({ message: "API is working" });

})
//! fetch all users

app.get("/allusers", async (req, res) => {
    try {
        const allusers = await UserModel.find()
        res.status(200).json({ message: "Data fetched", data: allusers })

    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again" })
    }
})

//! get user details by ID 
app.get("/profile/token", authentication, async (req, res) => {
    const id = req.id
    const user = await UserModel.findById(id)
    console.log(user)
    if (!user) {
        return res.status(404).json({ message: "user not found" })
    }
    res.status(200).json({ user })
})


//! register
app.post("/register", registerController)



//! login

app.post("/login", loginController);


//! forget the password
app.post("/changepassword", async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await UserModel.findOne({ email })
        console.log(user)
        if (!user) {
            res.status(404).json({ message: "Email not found" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        console.log(hashedPassword)

        const updateValue = await UserModel.updateOne({ email }, { $set: { password: hashedPassword } })
        res.status(200).json({ message: "password update " })

    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again" })
    }
})

//! Update profile
app.put("/update/:id", updateController)

//! profile delete
app.delete("/delete/:id", deleteController);

//! Forgot password (send otp in to the mail)
app.post("/forgotpassword",forgotPasswordController);

//! Verify-otp
app.post("/verify-otp",verifyotpController);

//! Reset-password and update password
app.post("/reset-password",updatePasswordController);

//! update profile (fullname, email) for authenticated user
app.put('/profile', authentication, updateProfileController);

//! habit endpoints (protected)
app.post('/habits', authentication, createHabit);
app.get('/habits', authentication, getHabits);
app.delete('/habits/:id', authentication, deleteHabit);
app.patch('/habits/:id', authentication, updateHabit);

//! logout (controller)
app.post('/logout', logoutController);

//! logout -> clear cookie
app.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
    });
    res.status(200).json({ message: "Logged out" });
});


app.listen(process.env.PORT, () => {
    console.log(`http:localhost:${process.env.PORT}`)
})
    })
    .catch((err) => {
        console.error('Failed to start server due to DB connection error:', err && err.message ? err.message : err);
        process.exit(1);
    });
