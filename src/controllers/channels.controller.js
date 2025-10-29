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

    const queryText = `
      SELECT 
        c.name AS channel,
        COUNT(s.id) AS total_orders,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket
      FROM sales s
      JOIN channels c ON c.id = s.channel_id
      WHERE s.created_at BETWEEN $1 AND $2
        AND s.sale_status_desc = 'COMPLETED'
      GROUP BY c.name
      ORDER BY total_revenue DESC;
    `;

    const result = await query(queryText, [start, end]);

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        channel: r.channel,
        total_orders: Number(r.total_orders),
        total_revenue: Number(r.total_revenue),
        avg_ticket: Number(r.avg_ticket),
      })),
    });
  } catch (err) {
    next(err);
  }
};
