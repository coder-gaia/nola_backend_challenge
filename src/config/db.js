import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const connectionString =
  process.env.NODE_ENV === "development"
    ? process.env.DEV_DATABASE
    : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "development"
      ? false
      : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);
export default pool;
