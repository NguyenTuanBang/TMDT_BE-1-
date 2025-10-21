import mongoose from "mongoose";
import CartModel from "./CartModel.js";
import { applyPromotionsToItems } from "../utils/calculateCart.js";

const CartStoreSchema = new mongoose.Schema(
  {
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
    },
    promotionExpiresAt: {
      type: Date, // lưu thời điểm hết hạn khuyến mãi
      default: null,
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0,
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    finalTotal: {
      type: Number,
      default: 0,
    },
    onDeploy: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


CartStoreSchema.pre("save", function (next) {
  this._promotionChanged = this.isModified("promotion");
  this._shippingChanged = this.isModified("shippingFee");
  this._deployChanged = this.isModified("onDeploy");
  next();
});

CartStoreSchema.post("save", async function (doc) {
  if (this._promotionChanged) {
    if (doc.promotion) {
      doc.promotionExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    } else {
      doc.promotionExpiresAt = null;
    }
    await doc.save(); 
    await applyPromotionsToItems(doc.cart_id, doc._id);
  }
});


CartStoreSchema.post("save", async function (doc) {
  console.log("CartStore shippingFee modified:", this._shippingChanged);
  if (this._shippingChanged) {
    await applyPromotionsToItems(doc.cart_id, doc._id);
  }
});


CartStoreSchema.post("save", async function (doc) {
  if (this._deployChanged && doc.onDeploy === false) {
    doc.promotion = null;
    await doc.save();

    const Cart = await CartModel.findById(doc.cart_id);
    const remainingStores = await mongoose.model("CartStore").find({
      cart_id: Cart._id,
      onDeploy: true,
    });

   
    if (remainingStores.length === 0) {
      Cart.promotion = null;
      await Cart.save();
    }

    await applyPromotionsToItems(doc.cart_id);
  }
});

const CartStoreModel = mongoose.model("CartStore", CartStoreSchema);
export default CartStoreModel;
