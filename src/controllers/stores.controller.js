import { query } from "../config/db.js";

export const getTopStores = async (req, res, next) => {
  try {
    const { start, end, channel_id } = req.query;

    const sql = `
      SELECT 
        st.name AS store_name,
        COUNT(s.id) AS total_sales,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      WHERE s.created_at BETWEEN $1 AND $2
        AND ($3::int IS NULL OR s.channel_id = $3)
      GROUP BY st.name
      ORDER BY total_revenue DESC
      LIMIT 10;
    `;

    const result = await query(sql, [start, end, channel_id || null]);

    const formatted = result.rows.map((row) => ({
      store_name: row.store_name,
      total_sales: Number(row.total_sales) || 0,
      total_revenue: Number(row.total_revenue) || 0,
      avg_ticket: Number(row.avg_ticket) || 0,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

export const getStoreRanking = async (req, res, next) => {
  try {
    const { start, end, limit = 10 } = req.query;

    const queryText = `
      SELECT
        st.name AS store,
        COUNT(s.id) AS total_sales,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY st.name
      ORDER BY total_revenue DESC
      LIMIT $3;
    `;

    const result = await query(queryText, [start, end, limit]);

    const formatted = result.rows.map((r) => ({
      store: r.store,
      total_sales: Number(r.total_sales) || 0,
      total_revenue: Number(r.total_revenue) || 0,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

export const getStorePerformance = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    const queryText = `
      SELECT
        st.name AS store,
        COUNT(s.id) AS total_sales,
        ROUND(AVG(s.production_seconds) / 60, 2) AS avg_production_time,
        ROUND(AVG(s.delivery_seconds) / 60, 2) AS avg_delivery_time
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      WHERE s.created_at BETWEEN $1 AND $2
        AND s.production_seconds IS NOT NULL
        AND s.delivery_seconds IS NOT NULL
      GROUP BY st.name
      ORDER BY avg_production_time ASC;
    `;

    const result = await query(queryText, [start, end]);

    const formatted = result.rows.map((r) => ({
      store: r.store,
      total_sales: Number(r.total_sales) || 0,
      avg_production_time: Number(r.avg_production_time) || 0,
      avg_delivery_time: Number(r.avg_delivery_time) || 0,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};
