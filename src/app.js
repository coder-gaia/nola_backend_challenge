import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  /^https:\/\/nola-frontend-[a-z0-9]+-codergaias-projects\.vercel\.app$/,
  "https://nola-frontend.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some((allowed) =>
          allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
        )
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api", routes);
app.use(errorHandler);

export default app;
