import express from "express";
import { getTopProducts } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/top-products", getTopProducts);

export default router;
