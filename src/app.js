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
    origin: ["https://nola-frontend.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(errorHandler);

export default app;
