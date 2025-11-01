import express from "express"
import authController from "../controllers/authController.js";
import OrderController from "../controllers/orderController.js";



const route = express.Router();

route.post("/", authController.protect, OrderController.createOrder)
route.post("/cancel", authController.protect, OrderController.cancelOrder)
route.post("/confirm", authController.protect, OrderController.comfirmedOrder)
route.post("/delivered", authController.protect, OrderController.deliveredOrder)
// route.get('/storeOrder', authController.protect, authController.restrictTo("seller"), OrderController.getStoreOrder)
// route.post("/", authController.protect, OrderController.createOrder);
// route.post("/cancel", authController.protect, OrderController.cancelOrder);
route.get("/", OrderController.getOrders);
// route.get("/:userId", OrderController.getOneOrders);
route.get("/:userId", OrderController.getOrder);

export default route