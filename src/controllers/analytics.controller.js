import { query } from "../config/db.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 });

const safeNum = (v) =>
  v === null || v === undefined || isNaN(v) ? 0 : Number(v);

export const getTopSubBrands = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const key = `topSubBrands:${start}:${end}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const sql = `
      SELECT 
        sb.name AS sub_brand_name,
        COUNT(s.id) AS total_sales,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      JOIN sub_brands sb ON sb.id = st.sub_brand_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY sb.name
      ORDER BY total_revenue DESC
      LIMIT 10;
    `;
    const result = await query(sql, [start, end]);
    const data = result.rows.map((r) => ({
      sub_brand_name: r.sub_brand_name,
      total_sales: safeNum(r.total_sales),
      total_revenue: safeNum(r.total_revenue),
      avg_ticket: safeNum(r.avg_ticket),
    }));

    const response = { success: true, data };
    cache.set(key, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getDashboardKpis = async (req, res, next) => {
  try {
    const { start, end, prevStart, prevEnd } = req.query;
    const key = `dashboardKpis:${start}:${end}:${prevStart}:${prevEnd}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const sql = `
      WITH current AS (
        SELECT 
          COUNT(*) AS total_sales,
          SUM(total_amount) AS total_revenue,
          AVG(total_amount) AS avg_ticket,
          COUNT(DISTINCT customer_id) AS total_customers
        FROM sales
        WHERE created_at BETWEEN $1 AND $2
      ),
      prev AS (
        SELECT SUM(total_amount) AS prev_revenue
        FROM sales
        WHERE created_at BETWEEN $3 AND $4
      )
      SELECT 
        c.*, p.prev_revenue
      FROM current c, prev p;
    `;

    const result = await query(sql, [start, end, prevStart, prevEnd]);
    const r = result.rows[0];
    const previous = safeNum(r.prev_revenue);

    const sales_growth =
      previous > 0
        ? Number(
            (((safeNum(r.total_revenue) - previous) / previous) * 100).toFixed(
              2
            )
          )
        : 0;

    const response = {
      success: true,
      data: {
        total_sales: safeNum(r.total_sales),
        total_revenue: safeNum(r.total_revenue),
        avg_ticket: safeNum(r.avg_ticket),
        total_customers: safeNum(r.total_customers),
        sales_growth,
      },
    };

    cache.set(key, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getFinancialOverview = async (req, res, next) => {
  try {
    const { start, end, channel_id } = req.query;

    const queryText = `
      SELECT 
        COUNT(s.id) AS total_orders,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket,
        ROUND(SUM(s.total_amount * 0.25)::numeric, 2) AS estimated_profit
      FROM sales s
      WHERE s.created_at BETWEEN $1 AND $2
        AND s.sale_status_desc = 'COMPLETED'
        AND ($3::int IS NULL OR s.channel_id = $3);
    `;

    const result = await query(queryText, [start, end, channel_id || null]);
    const data = result.rows[0];

    res.json({
      success: true,
      data: {
        total_orders: Number(data.total_orders) || 0,
        total_revenue: Number(data.total_revenue) || 0,
        avg_ticket: Number(data.avg_ticket) || 0,
        estimated_profit: Number(data.estimated_profit) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res
        .status(400)
        .json({ success: false, message: "start e end são obrigatórios" });
    }

    const key = `dashboardSummary:${start}:${end}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const sql = `
      WITH params AS (
        SELECT 
          $1::date AS start_date,
          $2::date AS end_date,
          ($2::date - $1::date + 1) AS num_days
      ),
      current_period AS (
        SELECT COUNT(*) AS total_sales,
               SUM(total_amount) AS total_revenue,
               AVG(total_amount) AS avg_ticket
        FROM sales s, params p
        WHERE s.created_at BETWEEN p.start_date AND p.end_date
      ),
      prev_period AS (
        SELECT COUNT(*) AS total_sales,
               SUM(total_amount) AS total_revenue,
               AVG(total_amount) AS avg_ticket
        FROM sales s, params p
        WHERE s.created_at BETWEEN 
          (p.start_date - (p.num_days || ' days')::interval)
          AND (p.start_date - INTERVAL '1 day')
      )
      SELECT 
        c.total_sales AS curr_sales, p.total_sales AS prev_sales,
        c.total_revenue AS curr_rev, p.total_revenue AS prev_rev,
        c.avg_ticket AS curr_ticket, p.avg_ticket AS prev_ticket
      FROM current_period c, prev_period p;
    `;

    const result = await query(sql, [start, end]);
    const r = result.rows[0] || {};

    const variation = (curr, prev) => {
      curr = safeNum(curr);
      prev = safeNum(prev);
      return prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(1)) : 0;
    };

    const response = {
      success: true,
      params: { start, end },
      data: {
        totals: {
          total_sales: safeNum(r.curr_sales),
          total_revenue: safeNum(r.curr_rev),
          avg_ticket: safeNum(r.curr_ticket),
        },
        variations: {
          total_sales: variation(r.curr_sales, r.prev_sales),
          total_revenue: variation(r.curr_rev, r.prev_rev),
          avg_ticket: variation(r.curr_ticket, r.prev_ticket),
        },
      },
    };

    cache.set(key, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getLowMarginProducts = async (req, res, next) => {
  try {
    const { start, end, cost_pct = 0.65, limit = 10 } = req.query;

    const key = `lowMargin:${start}:${end}:${cost_pct}:${limit}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const sql = `
      SELECT *
      FROM mv_product_margin_daily
      WHERE sale_date BETWEEN $1 AND $2
      ORDER BY (total_revenue / NULLIF(total_sold, 0)) ASC
      LIMIT $3;
    `;

    const result = await query(sql, [start, end, limit]);
    const response = { success: true, data: result.rows };

    cache.set(key, response);
    res.json(response);
  } catch (err) {
    console.error("Erro em getLowMarginProducts:", err);
    next(err);
  }
};

export const getDeliveryPerformance = async (req, res, next) => {
  try {
    const { start, end, group_by = null } = req.query;
    const key = `deliveryPerformance:${start}:${end}:${group_by || "none"}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    let groupClause = "";
    let selectGroup = "";
    if (group_by === "region") {
      selectGroup = ", st.region";
      groupClause = "GROUP BY st.region";
    } else if (group_by === "store") {
      selectGroup = ", st.name AS store_name";
      groupClause = "GROUP BY st.name";
    }

    const sql = `
      SELECT
        ROUND(AVG(s.delivery_seconds) / 60, 2) AS avg_delivery_minutes,
        ROUND(
          SUM(CASE WHEN s.delivery_seconds <= 3600 THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*), 0) * 100, 2
        ) AS on_time_rate,
        ROUND(
          SUM(CASE WHEN s.delivery_seconds > 3600 THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*), 0) * 100, 2
        ) AS late_rate,
        COUNT(*) AS total_orders
        ${selectGroup}
      FROM mv_delivery_daily s
      LEFT JOIN stores st ON st.id = s.store_id
      WHERE s.sale_date BETWEEN $1 AND $2
      ${groupClause}
      ORDER BY avg_delivery_minutes ASC;
    `;

    const values = [start, end];
    const result = await query(sql, values);

    const formatted = result.rows.map((row) => ({
      ...row,
      avg_delivery_minutes: Number(row.avg_delivery_minutes) || 0,
      on_time_rate: Number(row.on_time_rate) || 0,
      late_rate: Number(row.late_rate) || 0,
      total_orders: Number(row.total_orders) || 0,
    }));

    const response = {
      success: true,
      params: { start, end, group_by },
      data: formatted,
    };

    cache.set(key, response);
    res.json(response);
  } catch (err) {
    next(err);
  }
};
