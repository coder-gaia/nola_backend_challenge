import { jest } from "@jest/globals";
import request from "supertest";

// Mock dinâmico para ESM
jest.unstable_mockModule("../src/config/db.js", () => ({
  query: jest.fn(),
}));

// Importa dinamicamente os módulos mockados
const { query } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

describe("Channels Controller Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/top-channels", () => {
    it("deve retornar os 10 canais com maior receita", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            channel_name: "E-commerce",
            total_sales: 100,
            total_revenue: 5000,
            avg_ticket: 50,
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/top-channels?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].channel_name).toBe("E-commerce");
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/analytics/channel-performance", () => {
    it("deve retornar performance de canais formatada corretamente", async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            channel: "Loja Física",
            total_sales: "100",
            total_revenue: "5000",
          },
        ],
      });

      const res = await request(app).get(
        "/api/analytics/channel-performance?start=2025-01-01&end=2025-01-31"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].channel).toBe("Loja Física");
      expect(res.body.data[0].total_sales).toBe(100);
      expect(res.body.data[0].total_revenue).toBe(5000);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
