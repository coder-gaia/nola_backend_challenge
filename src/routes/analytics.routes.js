import express from "express";
import { getTopProducts } from "../controllers/products.controller.js";

const router = express.Router();

router.get("/top-products", getTopProducts);

export default router;
