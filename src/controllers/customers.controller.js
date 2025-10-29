import { query } from "../config/db.js";

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

export const getCustomerRetention = async (req, res, next) => {
  try {
    const { start, end, inactive_days = 30, min_orders = 1 } = req.query;

    const baseSql = `
      SELECT 
        c.id AS customer_id,
        c.customer_name AS customer_name,
        COUNT(s.id) AS orders_count,
        MAX(s.created_at) AS last_order_date,
        MIN(s.created_at) AS first_order_date
      FROM customers c
      JOIN sales s ON s.customer_id = c.id
      WHERE s.created_at BETWEEN $1 AND $2
        AND s.sale_status_desc = 'COMPLETED'
      GROUP BY c.id, c.customer_name;
    `;

    const baseResult = await query(baseSql, [start, end]);
    const customers = baseResult.rows;

    if (!customers.length) {
      return res.json({
        success: true,
        message: "Nenhum dado encontrado para o período selecionado.",
        data: {
          active_customers: 0,
          returning_customers: 0,
          churned_customers: 0,
          retention_rate: 0,
          average_days_between_orders: null,
        },
      });
    }

    const now = new Date(end);
    const activeCustomers = customers.length;
    const returningCustomers = customers.filter(
      (c) => Number(c.orders_count) >= 2
    ).length;
    const churnedCustomers = customers.filter((c) => {
      const lastOrder = new Date(c.last_order_date);
      const diffDays = (now - lastOrder) / (1000 * 60 * 60 * 24);
      return diffDays > Number(inactive_days);
    }).length;

    const retentionRate = activeCustomers
      ? Number(
          (
            ((activeCustomers - churnedCustomers) / activeCustomers) *
            100
          ).toFixed(1)
        )
      : 0;

    const intervalSql = `
      SELECT AVG(days_between) AS avg_days
      FROM (
        SELECT
          customer_id,
          (EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / (COUNT(id) - 1)) / 86400.0 AS days_between
        FROM sales
        WHERE created_at BETWEEN $1 AND $2
          AND sale_status_desc = 'COMPLETED'
        GROUP BY customer_id
        HAVING COUNT(id) > 1
      ) sub;
    `;
    const intervalRes = await query(intervalSql, [start, end]);

    let avgDaysBetweenOrders = null;
    if (intervalRes.rows[0] && intervalRes.rows[0].avg_days !== null) {
      avgDaysBetweenOrders = Number(intervalRes.rows[0].avg_days);
      avgDaysBetweenOrders = Number(avgDaysBetweenOrders.toFixed(1));
    }

    return res.json({
      success: true,
      params: {
        start,
        end,
        inactive_days: Number(inactive_days),
        min_orders: Number(min_orders),
      },
      data: {
        active_customers: activeCustomers,
        returning_customers: returningCustomers,
        churned_customers: churnedCustomers,
        retention_rate: retentionRate,
        average_days_between_orders: avgDaysBetweenOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};
