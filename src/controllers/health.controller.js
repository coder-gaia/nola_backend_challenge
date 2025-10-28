import { query } from "../config/db.js";

export const healthCheck = async (req, res, next) => {
  try {
    const result = await query("SELECT NOW()");
    res.json({
      success: true,
      message: "Backend online",
      db_time: result.rows[0].now,
    });
  } catch (err) {
    next(err);
  }
};
