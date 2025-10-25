import mongoose from "mongoose";
import { applyPromotionsToItems } from "../utils/calculateCart.js";

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shippingFee: {
    type: Number,
    default: 0,
  },
  subTotal: {
    type: Number,
    default: 0,
  },
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Promotion",
  },
  promotionExpiresAt: {
    type: Date, // lưu thời điểm hết hạn khuyến mãi
    default: null,
  },
  finalTotal: {
    type: Number,
    default: 0,
  },
});

cartSchema.pre("save", async function (next) {
  if (this.isModified("promotion")) {
    if (this.promotion) {
      this.promotionExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    } else {
      this.promotionExpiresAt = null;
    }
    await applyPromotionsToItems(this._id);
  }
  next();
});

const CartModel = mongoose.model("Cart", cartSchema);
export default CartModel;
