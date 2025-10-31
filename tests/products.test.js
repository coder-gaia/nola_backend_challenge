import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/config/db.js", () => ({
  query: jest.fn(),
}));

const { query } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

describe("Products Controller Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/top-products", () => {
    it("deve retornar os 10 produtos mais vendidos com sucesso", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            product_name: "Coca-Cola Lata",
            total_sold: 250,
            total_revenue: 3750.5,
            avg_price: 15.0,
            avg_cost: 9.75,
            margin_percent: 35.0,
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/top-products?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].product_name).toBe("Coca-Cola Lata");
      expect(res.body.data[0].total_sold).toBe(250);
      expect(res.body.data[0].total_revenue).toBeCloseTo(3750.5);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/analytics/top-products-by-period", () => {
    it("deve retornar produtos mais vendidos em um período com filtros aplicados", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            product_name: "Água Mineral 500ml",
            total_sold: 180,
            revenue: 900.0,
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/top-products-by-period?start=2025-01-01&end=2025-01-31&weekday=1&hour_start=8&hour_end=18&channel_id=3"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].product_name).toBe("Água Mineral 500ml");
      expect(res.body.data[0].total_sold).toBe(180);
      expect(res.body.data[0].revenue).toBeCloseTo(900.0);
      expect(res.body.filters.weekday).toBe("1");
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve funcionar mesmo sem filtros opcionais (weekday, hora, canal)", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            product_name: "Suco de Laranja 1L",
            total_sold: 75,
            revenue: 525.0,
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/top-products-by-period?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].product_name).toBe("Suco de Laranja 1L");
      expect(res.body.data[0].total_sold).toBe(75);
      expect(res.body.data[0].revenue).toBeCloseTo(525.0);
      expect(res.body.filters.weekday).toBeUndefined();
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
