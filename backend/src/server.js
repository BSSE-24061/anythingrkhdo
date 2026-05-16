const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const vitalRoutes = require("./routes/vitalRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const medicationRoutes = require("./routes/medicationRoutes");
const historyRoutes = require("./routes/historyRoutes");
const chatRoutes = require("./routes/chatRoutes");
const communityRoutes = require("./routes/communityRoutes");
const blogRoutes = require("./routes/blogRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

/* =========================
   Middleware
========================= */

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
        ],
        credentials: true,
    })
);

app.use(express.json());

app.use(
    session({
        secret: "healthlogsecret",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

/* =========================
   Google OAuth Setup
========================= */

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:5000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // You can save user to DB here later

                const user = {
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value,
                    picture: profile.photos?.[0]?.value,
                };

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

/* =========================
   Google Auth Routes
========================= */

// Start Google Login
app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

// Google Callback
app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "http://localhost:5173/login",
    }),
    (req, res) => {
        // Successful login
        res.redirect("http://localhost:5173");
    }
);

// Logout
app.get("/auth/logout", (req, res) => {
    req.logout(() => {
        res.redirect("http://localhost:5173/login");
    });
});

// Current Logged In User
app.get("/auth/user", (req, res) => {
    if (req.user) {
        res.json({
            success: true,
            user: req.user,
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Not authorized",
        });
    }
});

/* =========================
   API Routes
========================= */

app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/vitals", vitalRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/notifications", notificationRoutes);

/* =========================
   Health Check
========================= */

app.get("/", (req, res) => {
    res.json({
        status: "HealthLog API running ✅",
    });
});

/* =========================
   Start Server
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});