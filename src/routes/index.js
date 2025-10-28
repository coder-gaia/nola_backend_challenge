import express from "express";
import { healthCheck } from "../controllers/health.controller.js";
import analyticsRoutes from "./analytics.routes.js";
import {
  getTopProducts,
  getTopStores,
  getTopChannels,
  getTopSubBrands,
  getDashboardKpis,
  getSalesTimeline,
  getStoreRanking,
  getStorePerformance,
  getTopCustomers,
  getChannelPerformance,
  getSalesTrend,
  getFinancialOverview,
  getDashboardSummary,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/health", healthCheck);
router.use("/analytics", analyticsRoutes);
router.get("/analytics/top-products", getTopProducts);
router.get("/analytics/top-stores", getTopStores);
router.get("/analytics/top-channels", getTopChannels);
router.get("/analytics/top-subbrands", getTopSubBrands);
router.get("/analytics/kpis", getDashboardKpis);
router.get("/analytics/timeline", getSalesTimeline);
router.get("/analytics/store-ranking", getStoreRanking);
router.get("/analytics/store-performance", getStorePerformance);
router.get("/analytics/top-customers", getTopCustomers);
router.get("/analytics/channel-performance", getChannelPerformance);
router.get("/analytics/sales-trend", getSalesTrend);
router.get("/analytics/financial-overview", getFinancialOverview);
router.get("/analytics/summary", getDashboardSummary);

export default router;
