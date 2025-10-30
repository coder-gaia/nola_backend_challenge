import express from "express";
import { healthCheck } from "../controllers/health.controller.js";
//import analyticsRoutes from "./analytics.routes.js";
import {
  getTopSubBrands,
  getDashboardKpis,
  getFinancialOverview,
  getDashboardSummary,
  getLowMarginProducts,
  getDeliveryPerformance,
} from "../controllers/analytics.controller.js";

import {
  getTopProducts,
  getTopProductsByPeriod,
} from "../controllers/products.controller.js";
import {
  getStorePerformance,
  getStoreRanking,
  getTopStores,
} from "../controllers/stores.controller.js";
import {
  getChannelPerformance,
  getTopChannels,
} from "../controllers/channels.controller.js";
import {
  getCustomerRetention,
  getTopCustomers,
} from "../controllers/customers.controller.js";
import {
  getAverageTicket,
  getAvgTicketComparison,
} from "../controllers/tickets.controller.js";
import {
  getSalesTimeline,
  getSalesTrend,
} from "../controllers/sales.controller.js";

const router = express.Router();

router.get("/health", healthCheck);
//router.use("/analytics", analyticsRoutes);
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
router.get("/analytics/top-products-by-period", getTopProductsByPeriod);
router.get("/analytics/avg-ticket-comparison", getAvgTicketComparison);
router.get("/analytics/low-margin-products", getLowMarginProducts);
router.get("/analytics/delivery-performance", getDeliveryPerformance);
router.get("/analytics/customer-retention", getCustomerRetention);
router.get("/analytics/average-ticket", getAverageTicket);

export default router;
