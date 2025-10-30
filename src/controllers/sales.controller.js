import { query } from "../config/db.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 });

export const getSalesTimeline = async (req, res, next) => {
  try {
    const { start, end, groupBy = "day" } = req.query;

    let dateTrunc = "day";
    if (groupBy === "month") dateTrunc = "month";

    const queryText = `
      SELECT
        DATE_TRUNC('${dateTrunc}', created_at) AS period,
        COUNT(*) AS total_sales,
        SUM(total_amount) AS total_revenue
      FROM sales
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY period
      ORDER BY period;
    `;

    const result = await query(queryText, [start, end]);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        period: row.period,
        total_sales: Number(row.total_sales),
        total_revenue: Number(row.total_revenue),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getSalesTrend = async (req, res, next) => {
  try {
    const key = "salesTrend:" + JSON.stringify(req.query);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const { start, end, group = "day" } = req.query;
    const dateTrunc =
      group === "month" ? "month" : group === "week" ? "week" : "day";

    const sql = `
      SELECT 
        DATE_TRUNC('${dateTrunc}', created_at) AS period,
        COUNT(id) AS total_sales,
        ROUND(SUM(total_amount)::numeric, 2) AS total_revenue
      FROM sales
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY 1
      LIMIT 365;
    `;

    const result = await query(sql, [start, end]);
    const response = { success: true, data: result.rows };

    cache.set(key, response);
    res.json(response);
  } catch (err) {
    console.error("Erro em getSalesTrend:", err);
    next(err);
  }
};
