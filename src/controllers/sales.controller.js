import { query } from "../config/db.js";

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

export const getSalesTrend = async (req, res, next) => {
  try {
    const { start, end, interval = "month" } = req.query;

    let dateTrunc;
    switch (interval) {
      case "day":
        dateTrunc = "day";
        break;
      case "week":
        dateTrunc = "week";
        break;
      case "month":
      default:
        dateTrunc = "month";
        break;
    }

    const sql = `
      SELECT 
        DATE_TRUNC('${dateTrunc}', s.created_at) AS period,
        COUNT(DISTINCT s.id) AS total_sales,
        SUM(s.total_amount) AS total_revenue
      FROM sales s
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY period;
    `;

    const values = [start, end];
    const result = await query(sql, values);

    const formatted = result.rows.map((row) => ({
      period: new Date(row.period).toISOString().split("T")[0],
      total_sales: Number(row.total_sales),
      total_revenue: `R$ ${Number(row.total_revenue).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    }));

    res.json({
      success: true,
      params: { start, end, interval },
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};
