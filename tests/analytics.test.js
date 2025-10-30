import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/config/db.js", () => ({
  query: jest.fn(),
}));

const { query } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

describe("Analytics Controller Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/summary", () => {
    it("deve retornar resumo correto com sucesso", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            current_sales: 100,
            prev_sales: 80,
            current_revenue: 5000,
            prev_revenue: 4000,
            current_avg_ticket: 50,
            prev_avg_ticket: 45,
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/summary?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totals.total_sales).toBe(100);
      expect(res.body.data.variations.total_revenue).toBeCloseTo(25.0);
    });

    it("deve retornar erro 400 se faltar start ou end", async () => {
      const res = await request(app).get(
        "/api/analytics/summary?start=2025-01-01"
      );
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/obrigatórios/i);
    });
  });

  describe("GET /api/analytics/top-subbrands", () => {
    it("deve retornar as 10 sub-marcas mais vendidas", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            sub_brand_name: "Coca-Cola",
            total_sales: "200",
            total_revenue: "15000",
            avg_ticket: "75.0",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/top-subbrands?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].sub_brand_name).toBe("Coca-Cola");
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/analytics/financial-overview", () => {
    it("deve retornar overview financeiro corretamente", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            total_orders: "120",
            total_revenue: "9800",
            avg_ticket: "81.67",
            estimated_profit: "2450",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/financial-overview?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_orders).toBe(120);
      expect(res.body.data.estimated_profit).toBe(2450);
    });
  });

  describe("GET /api/analytics/low-margin-products", () => {
    it("deve retornar produtos com baixa margem formatados corretamente", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            product_name: "Água 500ml",
            avg_price: "5.0",
            avg_cost: "3.25",
            margin_ratio: "0.35",
            total_sold: "1200",
            total_revenue: "6000",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/low-margin-products?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].product_name).toBe("Água 500ml");
      expect(res.body.data[0].margin_percent).toBeCloseTo(35.0);
    });
  });

  describe("GET /api/analytics/delivery-performance", () => {
    it("deve retornar desempenho de entrega agrupado por região", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            avg_delivery_minutes: "45.3",
            on_time_rate: "92.5",
            late_rate: "7.5",
            total_orders: "300",
            region: "Sudeste",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/delivery-performance?start=2025-01-01&end=2025-01-31&group_by=region"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].region).toBe("Sudeste");
      expect(res.body.data[0].on_time_rate).toBeCloseTo(92.5);
    });
  });
});
