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
            curr_sales: 100,
            prev_sales: 80,
            curr_rev: 5000,
            prev_rev: 4000,
            curr_ticket: 50,
            prev_ticket: 40,
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/summary?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // campos corretos de acordo com seu controller
      expect(res.body.data.totals.total_sales).toBe(100);
      expect(res.body.data.totals.total_revenue).toBe(5000);
      expect(res.body.data.totals.avg_ticket).toBe(50);

      expect(res.body.data.variations.total_sales).toBeCloseTo(
        ((100 - 80) / 80) * 100
      );
      expect(res.body.data.variations.total_revenue).toBeCloseTo(
        ((5000 - 4000) / 4000) * 100
      );
      expect(res.body.data.variations.avg_ticket).toBeCloseTo(
        ((50 - 40) / 40) * 100
      );
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

  describe("GET /api/analytics/low-margin-products", () => {
    it("deve retornar produtos com baixa margem formatados corretamente", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            product_name: "Água 500ml",
            avg_price: "5.0",
            avg_cost: "3.25",
            margin_percent: "35.0",
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

      // converter para número antes de usar toBeCloseTo
      expect(Number(res.body.data[0].avg_price)).toBeCloseTo(5.0);
      expect(Number(res.body.data[0].avg_cost)).toBeCloseTo(3.25);
      expect(Number(res.body.data[0].margin_percent)).toBeCloseTo(35.0);

      expect(Number(res.body.data[0].total_sold)).toBe(1200);
      expect(Number(res.body.data[0].total_revenue)).toBe(6000);
    });
  });
});
