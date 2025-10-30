import { query } from "../config/db.js";

export const getTopProducts = async (req, res, next) => {
  try {
    const { start, end, channel_id, limit = 10 } = req.query;

    const values = [start, end];
    let whereClause = `WHERE s.created_at BETWEEN $1 AND $2`;

    if (channel_id) {
      values.push(channel_id);
      whereClause += ` AND s.channel_id = $${values.length}`;
    }

    const sql = `
      SELECT 
        p.name AS product_name,
        SUM(ps.quantity) AS total_sales,
        ROUND(SUM(ps.total_price)::numeric, 2) AS total_revenue,
        ROUND(AVG(ps.total_price)::numeric, 2) AS avg_ticket
      FROM sales s
      JOIN product_sales ps ON ps.sale_id = s.id
      JOIN products p ON p.id = ps.product_id
      ${whereClause}
        AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.name
      HAVING SUM(ps.total_price) > 0
      ORDER BY total_revenue DESC
      LIMIT ${limit};
    `;

    const result = await query(sql, values);

    res.json({
      success: true,
      params: { start, end, channel_id },
      data: result.rows.map((r) => ({
        product_name: r.product_name,
        total_sales: Number(r.total_sales) || 0,
        total_revenue: Number(Number(r.total_revenue).toFixed(2)) || 0,
        avg_ticket: Number(r.avg_ticket) || 0,
      })),
    });
  } catch (err) {
    console.error("❌ Erro em getTopProducts:", err);
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
