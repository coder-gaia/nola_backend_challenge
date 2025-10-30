import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/config/db.js", () => ({
  query: jest.fn(),
}));

const { query } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

describe("Tickets Controller Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/avg-ticket-comparison", () => {
    it("deve retornar comparação de ticket médio por canal com sucesso", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            group_name: "E-commerce",
            total_sales: "100",
            total_revenue: "50000",
            avg_ticket: "500",
          },
          {
            group_name: "Loja Física",
            total_sales: "80",
            total_revenue: "36000",
            avg_ticket: "450",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/avg-ticket-comparison?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.group_by).toBe("channel");
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toEqual({
        group_name: "E-commerce",
        total_sales: 100,
        total_revenue: 50000,
        avg_ticket: 500,
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve retornar comparação de ticket médio por loja se group_by=store", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            group_name: "Loja Centro",
            total_sales: "50",
            total_revenue: "25000",
            avg_ticket: "500",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/avg-ticket-comparison?start=2025-01-01&end=2025-01-31&group_by=store"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.group_by).toBe("store");
      expect(res.body.data[0].group_name).toBe("Loja Centro");
    });
  });

  describe("GET /api/analytics/average-ticket", () => {
    it("deve retornar ticket médio agrupado por loja com sucesso", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            store_name: "Loja Sul",
            total_sales: "90",
            total_revenue: "45000",
            avg_ticket: "500",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/average-ticket?start=2025-01-01&end=2025-01-31&group_by=store"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.group_by).toBe("store");
      expect(res.body.data[0]).toEqual({
        store_name: "Loja Sul",
        total_sales: 90,
        total_revenue: 45000,
        avg_ticket: 500,
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve retornar ticket médio agrupado por canal com sucesso", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            channel_name: "Delivery App",
            total_sales: "120",
            total_revenue: "60000",
            avg_ticket: "500",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/average-ticket?start=2025-01-01&end=2025-01-31&group_by=channel"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.group_by).toBe("channel");
      expect(res.body.data[0].channel_name).toBe("Delivery App");
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("deve retornar erro 400 se group_by for inválido", async () => {
      const res = await request(app).get(
        "/api/analytics/average-ticket?start=2025-01-01&end=2025-01-31&group_by=invalid"
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inválido/i);
      expect(query).not.toHaveBeenCalled();
    });
  });
});
