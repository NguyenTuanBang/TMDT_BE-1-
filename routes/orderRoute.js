import express from "express"
import authController from "../controllers/authController.js";
import OrderController from "../controllers/orderController.js";



const route = express.Router();

route.post("/", authController.protect, OrderController.createOrder)
route.post("/cancel", authController.protect, OrderController.cancelOrder)
// route.post("/", authController.protect, OrderController.createOrder);
// route.post("/cancel", authController.protect, OrderController.cancelOrder);
route.get("/", OrderController.getOrders);
// route.get("/:userId", OrderController.getOneOrders);
route.get("/:userId", OrderController.getOrder);

export default route