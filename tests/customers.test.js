import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/config/db.js", () => ({
  query: jest.fn(),
}));

const { query } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

describe("Customers Controller Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/top-customers", () => {
    it("deve retornar os 10 clientes com maior gasto total", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            customer: "Maria Silva",
            total_orders: "12",
            total_spent: "8450.50",
            avg_ticket: "704.2",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/top-customers?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].customer).toBe("Maria Silva");
      expect(res.body.data[0].total_orders).toBe(12);
      expect(res.body.data[0].avg_ticket).toBeCloseTo(704.2);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/analytics/customer-retention", () => {
    it("deve retornar métricas corretas de retenção de clientes", async () => {
      query
        .mockResolvedValueOnce({
          rows: [
            {
              customer_id: 1,
              customer_name: "João Souza",
              orders_count: "3",
              first_order_date: "2025-01-01",
              last_order_date: "2025-01-25",
            },
            {
              customer_id: 2,
              customer_name: "Carla Lima",
              orders_count: "1",
              first_order_date: "2025-01-05",
              last_order_date: "2025-01-10",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ avg_days: "8.5" }],
        });

      const res = await request(app).get(
        "/api/analytics/customer-retention?start=2025-01-01&end=2025-01-31&inactive_days=15"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.active_customers).toBe(2);
      expect(res.body.data.returning_customers).toBe(1);
      expect(res.body.data.churned_customers).toBe(1);
      expect(res.body.data.retention_rate).toBeCloseTo(50.0);
      expect(res.body.data.average_days_between_orders).toBeCloseTo(8.5);
      expect(query).toHaveBeenCalledTimes(2);
    });

    it("deve retornar resposta vazia e mensagem amigável quando não houver dados", async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get(
        "/api/analytics/customer-retention?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.active_customers).toBe(0);
      expect(res.body.message).toMatch(/nenhum dado/i);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
