import mongoose from "mongoose";
import CartModel from "./CartModel.js";
import { applyPromotionsToItems } from "../utils/calculateCart.js";

const CartStoreSchema = new mongoose.Schema({
    cart_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart"
    },
    store_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
    promotion:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion"
    },
    shippingFee:{
        type: Number,
        required: true,
        default: 0
    },
    subTotal:{
        type: Number,
        default: 0
    },
    finalTotal: {
        type: Number,
        default: 0
    },
    onDeploy: {
        type: Boolean,
        default: true
    }
},{
    timestamps: true
})



CartStoreSchema.pre("save", async function (next) {
    // Nếu chỉ thay đổi promotion hoặc phí ship, ta trigger lại tính toán
    if (this.isModified("promotion") || this.isModified("shippingFee")) {
        await applyPromotionsToItems(this.cart_id, this._id);
    }
    next();
});

CartStoreSchema.pre("save", async function (next) {
    // Nếu chỉ thay đổi trạng thái thì bỏ promotion của store này và nếu toàn bộ store đều bị loại bỏ thì sẽ xoá promotion trong Cart tổng
    if (this.isModified("onDeploy")) {
        this.promotion = null
        const Cart = await CartModel.findById(this.cart_id)
        const remainingCartStore = await CartStoreModel.find({cart_id: Cart._id})
        if(!remainingCartStore) Cart.promotion = null
        await applyPromotionsToItems(this.cart_id);
    }
    next();
});

const CartStoreModel = mongoose.model("CartStore", CartStoreSchema)
export default CartStoreModel