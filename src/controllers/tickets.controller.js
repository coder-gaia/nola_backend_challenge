import { query } from "../config/db.js";

export const getAvgTicketComparison = async (req, res, next) => {
  try {
    const { start, end, group_by = "channel" } = req.query;

    const groupColumn = group_by === "store" ? "st.name" : "c.name";
    const joinTable =
      group_by === "store"
        ? "JOIN stores st ON st.id = mv.store_id"
        : "JOIN channels c ON c.id = mv.channel_id";

    const sql = `
    SELECT 
    ${groupColumn} AS group_name,
    mv.total_sales,
    ROUND(mv.total_revenue::numeric, 2) AS total_revenue,
    ROUND(mv.avg_ticket::numeric, 2) AS avg_ticket
    FROM avg_ticket_comparison_mv mv
    ${joinTable}
    WHERE mv.last_sale_at BETWEEN $1 AND $2
    ORDER BY mv.avg_ticket DESC;
`;

    const result = await query(sql, [start, end]);

    const formatted = result.rows.map((row) => ({
      ...row,
      total_sales: Number(row.total_sales) || 0,
      total_revenue: Number(row.total_revenue) || 0,
      avg_ticket: Number(row.avg_ticket) || 0,
    }));

    res.json({
      success: true,
      group_by,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

export const getAverageTicket = async (req, res, next) => {
  try {
    const { start, end, group_by = "store" } = req.query;

    if (!["store", "channel"].includes(group_by)) {
      return res.status(400).json({
        success: false,
        message: "Parâmetro 'group_by' inválido. Use 'store' ou 'channel'.",
      });
    }

    const groupColumn = group_by === "store" ? "st.name" : "ch.name";
    const groupLabel = group_by === "store" ? "store_name" : "channel_name";

    const sql = `
      SELECT 
        ${groupColumn} AS ${groupLabel},
        COUNT(s.id) AS total_sales,
        ROUND(SUM(s.total_amount)::numeric, 2) AS total_revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) AS avg_ticket
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      JOIN channels ch ON ch.id = s.channel_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY ${groupColumn}
      ORDER BY avg_ticket DESC;
    `;

    const values = [start, end];
    const result = await query(sql, values);

    const formatted = result.rows.map((row) => ({
      ...row,
      total_sales: Number(row.total_sales) || 0,
      total_revenue: Number(row.total_revenue) || 0,
      avg_ticket: Number(row.avg_ticket) || 0,
    }));

    res.json({
      success: true,
      group_by,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};
