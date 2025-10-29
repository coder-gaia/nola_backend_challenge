import { query } from "../config/db.js";

export const getTopProducts = async (req, res, next) => {
  try {
    const { start, end, channel_id } = req.query;

    const sql = `
      SELECT 
        p.name AS product_name,
        SUM(ps.quantity) AS total_sold,
        ROUND(SUM(ps.total_price)::numeric, 2) AS revenue
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN sales s ON s.id = ps.sale_id
      WHERE s.created_at BETWEEN $1 AND $2
        AND ($3::int IS NULL OR s.channel_id = $3)
      GROUP BY p.name
      ORDER BY total_sold DESC
      LIMIT 10;
    `;

    const values = [start, end, channel_id || null];

    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

export const getTopProductsByPeriod = async (req, res, next) => {
  try {
    const { start, end, weekday, hour_start, hour_end, channel_id } = req.query;

    const sql = `
      SELECT 
        p.name AS product_name,
        SUM(ps.quantity) AS total_sold,
        ROUND(SUM(ps.total_price)::numeric, 2) AS revenue
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN sales s ON s.id = ps.sale_id
      WHERE s.created_at BETWEEN $1 AND $2
        ${weekday ? `AND EXTRACT(DOW FROM s.created_at) = ${weekday}` : ""}
        ${
          hour_start && hour_end
            ? `AND EXTRACT(HOUR FROM s.created_at) BETWEEN ${hour_start} AND ${hour_end}`
            : ""
        }
        ${channel_id ? `AND s.channel_id = ${channel_id}` : ""}
      GROUP BY p.name
      ORDER BY total_sold DESC
      LIMIT 10;
    `;

    const values = [start, end];
    const result = await query(sql, values);

    res.json({
      success: true,
      filters: {
        start,
        end,
        weekday,
        hour_start,
        hour_end,
        channel_id,
      },
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};
