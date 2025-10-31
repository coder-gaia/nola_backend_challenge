import { query } from "../config/db.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 });

export const getTopProducts = async (req, res, next) => {
  try {
    const { start, end, limit = 10, cost_pct = 0.65 } = req.query;
    const key = `topProducts:${start}:${end}:${limit}:${cost_pct}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const sql = `
  SELECT 
    p.name AS product_name,
    SUM(ps.quantity) AS total_sold,
    ROUND(SUM(ps.total_price)::numeric, 2) AS total_revenue,
    ROUND(AVG(ps.base_price)::numeric, 2) AS avg_price,
    ROUND(AVG(ps.base_price * $3)::numeric, 2) AS avg_cost,
    ROUND((((AVG(ps.base_price) - AVG(ps.base_price * $3)) / NULLIF(AVG(ps.base_price), 0)) * 100)::numeric, 2) AS margin_percent
  FROM product_sales ps
  JOIN products p ON p.id = ps.product_id
  JOIN sales s ON s.id = ps.sale_id
  WHERE s.created_at BETWEEN $1 AND $2
  GROUP BY p.name
  ORDER BY total_revenue DESC
  LIMIT $4;
`;

    const result = await query(sql, [start, end, cost_pct, limit]);

    const response = {
      success: true,
      data: result.rows.map((r) => ({
        product_name: r.product_name,
        total_sold: Number(r.total_sold),
        total_revenue: Number(r.total_revenue),
        avg_price: Number(r.avg_price),
        avg_cost: Number(r.avg_cost),
        margin_percent: Number(r.margin_percent),
      })),
    };

    cache.set(key, response);
    res.json(response);
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
