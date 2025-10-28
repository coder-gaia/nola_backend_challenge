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

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

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

    res.json({
      success: true,
      data: result.rows,
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

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        store: r.store,
        total_sales: Number(r.total_sales),
        total_revenue: Number(r.total_revenue),
      })),
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

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        store: r.store,
        total_sales: Number(r.total_sales),
        avg_production_time: Number(r.avg_production_time),
        avg_delivery_time: Number(r.avg_delivery_time),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getTopCustomers = async (req, res, next) => {
  try {
    const { start, end, limit = 10 } = req.query;

    const queryText = `
      SELECT 
        s.customer_name AS customer,
        COUNT(s.id) AS total_orders,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_spent,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket
      FROM sales s
      WHERE s.created_at BETWEEN $1 AND $2
        AND s.customer_name IS NOT NULL
        AND s.sale_status_desc = 'COMPLETED'
      GROUP BY s.customer_name
      ORDER BY total_spent DESC
      LIMIT $3;
    `;

    const result = await query(queryText, [start, end, limit]);

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        customer: r.customer,
        total_orders: Number(r.total_orders),
        total_spent: Number(r.total_spent),
        avg_ticket: Number(r.avg_ticket),
      })),
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

export const getSalesTrend = async (req, res, next) => {
  try {
    const { start, end, group = "day" } = req.query;

    let dateTrunc;
    if (group === "month") dateTrunc = "month";
    else if (group === "week") dateTrunc = "week";
    else dateTrunc = "day";

    const queryText = `
      SELECT 
        DATE_TRUNC('${dateTrunc}', s.created_at) AS period,
        COUNT(s.id) AS total_orders,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue
      FROM sales s
      WHERE s.created_at BETWEEN $1 AND $2
        AND s.sale_status_desc = 'COMPLETED'
      GROUP BY period
      ORDER BY period;
    `;

    const result = await query(queryText, [start, end]);

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        period: r.period,
        total_orders: Number(r.total_orders),
        total_revenue: Number(r.total_revenue),
      })),
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

    const mainQuery = `
      SELECT 
        COUNT(*) AS total_sales,
        SUM(s.total_amount) AS total_revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket
      FROM sales s
      WHERE s.created_at BETWEEN $1 AND $2;
    `;
    const mainResult = await query(mainQuery, [start, end]);
    const { total_sales, total_revenue, avg_ticket } = mainResult.rows[0];

    const topProductsQuery = `
      SELECT 
        p.name AS product_name,
        SUM(ps.quantity) AS total_quantity,
        ROUND(SUM(ps.total_price)::numeric, 2) AS total_revenue
      FROM product_sales ps
      JOIN products p ON p.id = ps.product_id
      JOIN sales s ON s.id = ps.sale_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY p.name
      ORDER BY total_quantity DESC
      LIMIT 5;
    `;
    const topProductsResult = await query(topProductsQuery, [start, end]);

    const topChannelsQuery = `
      SELECT 
        c.name AS channel_name,
        COUNT(s.id) AS total_sales,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue
      FROM sales s
      JOIN channels c ON c.id = s.channel_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY c.name
      ORDER BY total_revenue DESC
      LIMIT 5;
    `;
    const topChannelsResult = await query(topChannelsQuery, [start, end]);

    res.json({
      success: true,
      data: {
        totals: {
          total_sales: Number(total_sales) || 0,
          total_revenue: Number(total_revenue) || 0,
          avg_ticket: Number(avg_ticket) || 0,
        },
        top_products: topProductsResult.rows,
        top_channels: topChannelsResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};
