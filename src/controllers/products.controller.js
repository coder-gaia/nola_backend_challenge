import { query } from "../config/db.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 });

export const getTopProducts = async (req, res, next) => {
  try {
    const { start, end, channel_id, limit = 10 } = req.query;
    const key = `topProducts:${start}:${end}:${channel_id || "all"}:${limit}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const values = [start, end];
    let whereClause = `WHERE s.created_at BETWEEN $1 AND $2`;

    if (channel_id) {
      values.push(channel_id);
      whereClause += ` AND s.channel_id = $${values.length}`;
    }

    values.push(limit);

    const sql = `
      SELECT
        p.name AS product_name,
        SUM(ps.quantity) AS total_sold,
        ROUND(SUM(ps.total_price)::numeric, 2) AS total_revenue,
        ROUND(SUM(ps.total_cost)::numeric, 2) AS total_cost,
        ROUND((SUM(ps.total_price) - SUM(ps.total_cost)) / NULLIF(SUM(ps.total_price), 0) * 100, 2) AS margin_percent
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN sales s ON s.id = ps.sale_id
      ${whereClause}
      GROUP BY p.name
      ORDER BY total_revenue DESC
      LIMIT $${values.length};
    `;

    const result = await query(sql, values);

    const response = {
      success: true,
      params: { start, end, channel_id },
      data: result.rows.map((r) => ({
        product_name: r.product_name,
        total_sold: Number(r.total_sold) || 0,
        total_revenue: Number(r.total_revenue) || 0,
        total_cost: Number(r.total_cost) || 0,
        margin_percent: Number(r.margin_percent) || 0,
      })),
    };

    cache.set(key, response);
    return res.json(response);
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
