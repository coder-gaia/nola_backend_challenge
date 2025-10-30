import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/config/db.js", () => ({
  query: jest.fn(),
}));

const { query } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

describe("Sales Controller Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/timeline", () => {
    it("deve retornar o timeline de vendas agrupado por dia", async () => {
      query.mockResolvedValueOnce({
        rows: [
          { period: "2025-01-01", total_sales: "15", total_revenue: "2500.75" },
          { period: "2025-01-02", total_sales: "12", total_revenue: "2000.00" },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/timeline?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toEqual({
        period: "2025-01-01",
        total_sales: 15,
        total_revenue: 2500.75,
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve aceitar o parâmetro groupBy=month e gerar query agrupada por mês", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            period: "2025-01-01",
            total_sales: "100",
            total_revenue: "15000.00",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/timeline?start=2025-01-01&end=2025-12-31&groupBy=month"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].total_sales).toBe(100);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/analytics/sales-trend", () => {
    it("deve retornar a tendência de vendas agrupada por mês (default)", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            period: "2025-01-01T00:00:00.000Z",
            total_sales: "40",
            total_revenue: "8000",
          },
          {
            period: "2025-02-01T00:00:00.000Z",
            total_sales: "55",
            total_revenue: "11000",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/sales-trend?start=2025-01-01&end=2025-12-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.params.interval).toBe("month");
      expect(res.body.data[0].period).toBe("2025-01-01");
      expect(res.body.data[0].total_sales).toBe(40);
      expect(res.body.data[0].total_revenue).toContain("R$");
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve aceitar interval=week e retornar corretamente", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            period: "2025-03-03T00:00:00.000Z",
            total_sales: "20",
            total_revenue: "5000",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/sales-trend?start=2025-03-01&end=2025-03-31&interval=week"
      );

      expect(res.status).toBe(200);
      expect(res.body.params.interval).toBe("week");
      expect(res.body.data[0].period).toBe("2025-03-03");
      expect(res.body.data[0].total_sales).toBe(20);
      expect(res.body.data[0].total_revenue).toContain("R$ 5.000,00");
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve aceitar interval=day e retornar corretamente", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            period: "2025-03-15T00:00:00.000Z",
            total_sales: "5",
            total_revenue: "1500",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/sales-trend?start=2025-03-01&end=2025-03-31&interval=day"
      );

      expect(res.status).toBe(200);
      expect(res.body.params.interval).toBe("day");
      expect(res.body.data[0].period).toBe("2025-03-15");
      expect(res.body.data[0].total_sales).toBe(5);
      expect(res.body.data[0].total_revenue).toBe("R$ 1.500,00");
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
