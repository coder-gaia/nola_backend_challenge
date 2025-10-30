import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("🛰️ CORS request from:", origin);

      const allowedOrigins = [
        "https://nola-frontend.vercel.app",
        "http://localhost:5173",
      ];

      const vercelPreview = /^https:\/\/nola-frontend-[a-z0-9-]+\.vercel\.app$/;

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        vercelPreview.test(origin)
      ) {
        callback(null, true);
      } else {
        console.log("🚫 Blocked CORS from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(errorHandler);

export default app;
