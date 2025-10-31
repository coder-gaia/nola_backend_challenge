import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://nola-frontend-r93whj8fo-codergaias-projects.vercel.app",
  "https://nola-frontend-9y7bxfqtg-codergaias-projects.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(helmet());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(errorHandler);

export default app;
