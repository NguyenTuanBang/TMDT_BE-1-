import mongoose from "mongoose";
import { applyPromotionsToItems } from "../utils/calculateCart.js";

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    shippingFee: {
        type: Number,
        default:0
    },
    subTotal: {
        type: Number,
        default: 0
    },
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion"
    },
    finalTotal: {
        type: Number,
        default: 0
    }
});

// cartSchema.pre("save", async function (next) {
//     const CartStore = mongoose.model("CartStore");
//     try {
//         const stores = await CartStore.find({ cart_id: this._id });

//         let total = 0;
//         let shipping = 0;

//         for (const store of stores) {
//             total += store.finalTotal || 0;
//             shipping += store.shippingFee || 0;
//         }

//         this.subTotal = total;
//         this.shippingFee = shipping;

//         next();
//     } catch (err) {
//         next(err);
//     }
// })
// cartSchema.pre("save", async function(next) {
//     try {
//             const Promotion = mongoose.model("Promotion");
    
//             let discount = 0;
    
//             if (this.promotion) {
//                 const promo = await Promotion.findById(this.promotion);
    
//                 if (promo) {
//                     if (promo.discount_type === "fixed") {
//                         discount = promo.discount_value;
//                     } else if (promo.discount_type === "percentage") {
//                         // giới hạn mức giảm tối đa nếu có
//                         if (promo.max_discount_value) {
//                             discount = Math.min(
//                                 this.subTotal * (promo.discount_value / 100),
//                                 promo.max_discount_value
//                             );
//                         } else {
//                             discount = this.subTotal * (promo.discount_value / 100);
//                         }
//                     }
//                 }
//             }   
//             // Không để âm tiền
//             this.finalTotal = Math.max(0, this.subTotal - discount) + this.shippingFee ;  
//             next();
//         } catch (err) {
//             next(err);
//         }
// })


cartSchema.pre("save", async function (next) {
    if (this.isModified("promotion")) {
        await applyPromotionsToItems(this._id);
    }
    next();
});


const CartModel = mongoose.model("Cart", cartSchema);
export default CartModel;
