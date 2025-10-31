import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://nola-frontend-r93whj8fo-codergaias-projects.vercel.app",
  "https://nola-frontend-9y7bxfqtg-codergaias-projects.vercel.app",
  "https://nola-frontend-39tuxhxqs-codergaias-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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
