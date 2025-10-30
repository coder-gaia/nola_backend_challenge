import { query } from "../config/db.js";

export const getTopSubBrands = async (req, res, next) => {
  try {
    const { start, end } = req.query;

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

    const formattedRows = result.rows.map((row) => ({
      sub_brand_name: row.sub_brand_name,
      total_sales: Number(row.total_sales) || 0,
      total_revenue: Number(row.total_revenue) || 0,
      avg_ticket: Number(row.avg_ticket) || 0,
    }));

    res.json({
      success: true,
      data: formattedRows,
    });
  } catch (err) {
    next(err);
  }
};

export const getDashboardKpis = async (req, res, next) => {
  try {
    const { start, end, prevStart, prevEnd } = req.query;

    const totalQuery = `
      SELECT 
        COUNT(*) AS total_sales,
        SUM(total_amount) AS total_revenue,
        ROUND(AVG(total_amount)::numeric, 2) AS avg_ticket
      FROM sales
      WHERE created_at BETWEEN $1 AND $2;
    `;

    const totalResult = await query(totalQuery, [start, end]);
    const { total_sales, total_revenue, avg_ticket } = totalResult.rows[0];

    const customerQuery = `
      SELECT COUNT(DISTINCT customer_id) AS total_customers
      FROM sales
      WHERE created_at BETWEEN $1 AND $2;
    `;
    const customerResult = await query(customerQuery, [start, end]);
    const { total_customers } = customerResult.rows[0];

    const growthQuery = `
      SELECT 
        SUM(total_amount) AS previous_revenue
      FROM sales
      WHERE created_at BETWEEN $1 AND $2;
    `;
    const prevResult = await query(growthQuery, [prevStart, prevEnd]);
    const previous_revenue = prevResult.rows[0].previous_revenue || 0;

    let sales_growth = 0;
    if (previous_revenue > 0) {
      sales_growth =
        ((total_revenue - previous_revenue) / previous_revenue) * 100;
    }

    res.json({
      success: true,
      data: {
        total_sales: Number(total_sales) || 0,
        total_revenue: Number(total_revenue) || 0,
        avg_ticket: Number(avg_ticket) || 0,
        total_customers: Number(total_customers) || 0,
        sales_growth: Number(sales_growth.toFixed(2)) || 0,
      },
    });
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

    const sql = `
      WITH params AS (
        SELECT 
          $1::date AS start_date,
          $2::date AS end_date,
          ($2::date - $1::date + 1) AS num_days
      ),
      current_period AS (
        SELECT 
          COUNT(*) AS total_sales,
          SUM(total_amount) AS total_revenue,
          AVG(total_amount) AS avg_ticket
        FROM sales s, params p
        WHERE s.created_at BETWEEN p.start_date AND p.end_date
      ),
      previous_period AS (
        SELECT 
          COUNT(*) AS total_sales,
          SUM(total_amount) AS total_revenue,
          AVG(total_amount) AS avg_ticket
        FROM sales s, params p
        WHERE s.created_at BETWEEN 
          (p.start_date - (p.num_days || ' days')::interval) AND 
          (p.start_date - INTERVAL '1 day')
      )
      SELECT 
        c.total_sales AS current_sales,
        p.total_sales AS prev_sales,
        c.total_revenue AS current_revenue,
        p.total_revenue AS prev_revenue,
        c.avg_ticket AS current_avg_ticket,
        p.avg_ticket AS prev_avg_ticket
      FROM current_period c, previous_period p;
    `;

    const values = [start, end];
    const result = await query(sql, values);
    const r = result.rows[0] || {};

    const safe = (v) =>
      v === null || v === undefined || isNaN(v) ? 0 : Number(v);

    const variation = (curr, prev) => {
      curr = safe(curr);
      prev = safe(prev);
      if (prev === 0) return 0;
      const diff = ((curr - prev) / prev) * 100;
      return Number.isFinite(diff) ? Number(diff.toFixed(1)) : 0;
    };

    const data = {
      totals: {
        total_sales: safe(r.current_sales),
        total_revenue: Number(safe(r.current_revenue).toFixed(2)),
        avg_ticket: Number(safe(r.current_avg_ticket).toFixed(2)),
      },
      variations: {
        total_sales: variation(r.current_sales, r.prev_sales),
        total_revenue: variation(r.current_revenue, r.prev_revenue),
        avg_ticket: variation(r.current_avg_ticket, r.prev_avg_ticket),
      },
    };

    res.json({ success: true, params: { start, end }, data });
  } catch (err) {
    next(err);
  }
};

export const getLowMarginProducts = async (req, res, next) => {
  try {
    const { start, end, limit = 10, cost_pct = 0.65 } = req.query;

    const sql = `
      SELECT 
        p.name AS product_name,
        ROUND(AVG(ps.base_price)::numeric, 2) AS avg_price,
        ROUND((AVG(ps.base_price) * $3::numeric)::numeric, 2) AS avg_cost,
        ROUND(
          (
            (AVG(ps.base_price) - (AVG(ps.base_price) * $3::numeric))
            / NULLIF(AVG(ps.base_price), 0)
          )::numeric, 4
        ) AS margin_ratio,
        SUM(ps.quantity) AS total_sold,
        ROUND(SUM(ps.total_price)::numeric, 2) AS total_revenue
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN sales s ON s.id = ps.sale_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY p.name
      ORDER BY margin_ratio ASC
      LIMIT $4;
    `;

    const values = [start, end, parseFloat(cost_pct), limit];
    const result = await query(sql, values);

    const formatted = result.rows.map((r) => {
      const avg_price = Number(r.avg_price) || 0;
      const avg_cost = Number(r.avg_cost) || 0;
      const ratio = Number(r.margin_ratio);

      let margin_percent = null;
      if (!isNaN(ratio)) {
        margin_percent = ratio <= 1 ? ratio * 100 : ratio;
      }

      return {
        product_name: r.product_name,
        avg_price,
        avg_cost,
        margin_percent:
          margin_percent !== null ? Number(margin_percent.toFixed(2)) : null,
        total_sold: Number(r.total_sold) || 0,
        total_revenue: Number(r.total_revenue) || 0,
      };
    });

    res.json({
      success: true,
      params: {
        start,
        end,
        limit: Number(limit),
        cost_pct: Number(cost_pct),
      },
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryPerformance = async (req, res, next) => {
  try {
    const { start, end, group_by = null } = req.query;

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
      FROM sales s
      LEFT JOIN stores st ON st.id = s.store_id
      WHERE s.created_at BETWEEN $1 AND $2
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

    res.json({
      success: true,
      params: { start, end, group_by },
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};
