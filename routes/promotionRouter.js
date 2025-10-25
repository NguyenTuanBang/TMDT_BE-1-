import express from "express"
import authController from "../controllers/authController.js"
import PromotionController from "../controllers/promotionController.js"

const route = express.Router()

route.post("/", authController.protect, authController.restrictTo("admin", "seller"), PromotionController.createPromotion)
route.get("/global", authController.protect, PromotionController.getGlobalPromotion)
route.get("/store/:storeId", authController.protect, PromotionController.getStorePromotion)

export default route