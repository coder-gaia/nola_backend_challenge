import { query } from "../config/db.js";

export const getTopChannels = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    const sql = `
      SELECT 
        c.name AS channel_name,
        COUNT(s.id) AS total_sales,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket
      FROM sales s
      JOIN channels c ON c.id = s.channel_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY c.name
      ORDER BY total_revenue DESC
      LIMIT 10;
    `;

    const result = await query(sql, [start, end]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

export const getChannelPerformance = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    const sql = `
      SELECT 
        c.name AS channel,
        COUNT(s.id) AS total_sales,
        SUM(s.total_amount) AS total_revenue
      FROM sales s
      JOIN channels c ON c.id = s.channel_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY c.name
      ORDER BY total_revenue DESC;
    `;

    const result = await query(sql, [start, end]);

    res.json({
      success: true,
      params: { start, end },
      data: result.rows.map((r) => ({
        channel: r.channel,
        total_sales: Number(r.total_sales),
        total_revenue: Number(r.total_revenue),
      })),
    });
  } catch (err) {
    next(err);
  }
};
