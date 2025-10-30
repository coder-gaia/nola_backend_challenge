import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/config/db.js", () => ({
  query: jest.fn(),
}));

const { query } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

describe("Stores Controller Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/top-stores", () => {
    it("deve retornar as top stores com sucesso", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            store_name: "Loja A",
            total_sales: "120",
            total_revenue: "35000.50",
            avg_ticket: "291.67",
          },
          {
            store_name: "Loja B",
            total_sales: "80",
            total_revenue: "20000.00",
            avg_ticket: "250.00",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/top-stores?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toEqual({
        store_name: "Loja A",
        total_sales: 120,
        total_revenue: 35000.5,
        avg_ticket: 291.67,
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve considerar channel_id opcional e funcionar normalmente", async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get(
        "/api/analytics/top-stores?start=2025-01-01&end=2025-01-31&channel_id=5"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["2025-01-01", "2025-01-31", "5"])
      );
    });
  });

  describe("GET /api/analytics/store-ranking", () => {
    it("deve retornar o ranking de lojas com sucesso", async () => {
      query.mockResolvedValueOnce({
        rows: [
          { store: "Loja X", total_sales: "40", total_revenue: "8000" },
          { store: "Loja Y", total_sales: "25", total_revenue: "5000" },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/store-ranking?start=2025-01-01&end=2025-01-31&limit=5"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].store).toBe("Loja X");
      expect(res.body.data[0].total_revenue).toBe(8000);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledWith(expect.any(String), [
        "2025-01-01",
        "2025-01-31",
        "5",
      ]);
    });
  });

  describe("GET /api/analytics/store-performance", () => {
    it("deve retornar o desempenho das lojas corretamente", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            store: "Loja Norte",
            total_sales: "90",
            avg_production_time: "12.5",
            avg_delivery_time: "18.2",
          },
          {
            store: "Loja Sul",
            total_sales: "70",
            avg_production_time: "10.1",
            avg_delivery_time: "15.7",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/store-performance?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toEqual({
        store: "Loja Norte",
        total_sales: 90,
        avg_production_time: 12.5,
        avg_delivery_time: 18.2,
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve lidar corretamente com retorno vazio", async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get(
        "/api/analytics/store-performance?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
