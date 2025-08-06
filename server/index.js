import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import path from "path";
import job from "./utils/cron.js";
import helmet from "helmet";
import mongoSanitize from 'express-mongo-sanitize';
import morgan from "morgan"; 
import csrf from "csurf";
import rateLimit from "express-rate-limit";
import compression from "compression";
import zlib from "zlib";

dotenv.config({});

// call database connection here
connectDB();
const app = express();

const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// default middleware
app.use(morgan('dev')); 
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    status: 429,
    error: "Too many requests, please try again later."
  }
});

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production"
  },
});

app.use(csrfProtection);
app.use(compression({
  level: zlib.constants.Z_BEST_COMPRESSION, // Max compression
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false; // allow client to disable
    }
    return compression.filter(req, res);
  }
}));
app.use(mongoSanitize());
app.use(helmet());
app.use(limiter);

app.use(cors({
    origin: ["http://localhost:5173", "https://educore-oj6e.onrender.com"],
    credentials:true
}));

app.get("/healthcheck", (req, res) => {
  res.status(200).send("Server is healthy");
});

// apis
job.start();
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);
 
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "dist", "index.html"));
  });
}
 
app.listen(PORT, () => {
    console.log(`Server listen at port ${PORT}`);
})


