import express from "express";
import authController from "../controllers/authController.js";
import CartController from "../controllers/cartController.js";
const router = express.Router();

router.get("/", authController.protect, CartController.getCart);
router.post("/addToCart", authController.protect, CartController.addToCart);
router.post("/buyNow", authController.protect, CartController.buyNow);
router.post("/reduce", authController.protect, CartController.reduceFromCart);
router.post("/increase", authController.protect, CartController.increaseFromCart);
router.post("/remove", authController.protect, CartController.removeFromCart)
router.post("/change", authController.protect, CartController.changeCartItemState)
router.get('/count', authController.protect, CartController.numberOfItem)
router.get('/preOrder', authController.protect, CartController.getPreOrderCart)
router.post('/shippingFee', authController.protect, CartController.checkShippingFee)

export default router;

