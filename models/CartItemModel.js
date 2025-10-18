import mongoose from "mongoose";
import { applyPromotionsToItems } from "../utils/calculateCart.js";

const cartItemSchema = new mongoose.Schema({
  cartStore_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CartStore",
    required: true,
  },
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariants",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unitPrice: {
    type: Number,
  },
  //giá trị sau khi đã giảm hết
  finalPrice: {
    type: Number,
  },
  is_chosen: {
    type: Boolean,
    default: false, 
  },
  is_out_of_stock: {
    type: Boolean,
    default: false,
  },
  //giá trị được giảm
  discountValue: { type: Number, default: 0 },
});

// cartItemSchema.pre("save", async function (next) {
//     this.finalPrice = this.unitPrice*this.quantity
//     next()
// });
// cartItemSchema.pre("save", async function(next) {
//     this.finalPrice = this.unitPrice * this.quantity;
//     await updateCartStoreAndCart(this.cartStore_id);
//     next();
// });

// cartItemSchema.pre("deleteOne", { document: true, query: false }, async function(next) {
//     await updateCartStoreAndCart(this.cartStore_id);
//     next();
// });

// // Helper
// async function updateCartStoreAndCart(cartStoreId) {
//     const CartStore = mongoose.model("CartStore");
//     const Cart = mongoose.model("Cart");

//     if (cartStoreId) {
//         const cartStore = await CartStore.findById(cartStoreId);
//         if (cartStore) {
//             await cartStore.save();
//             const cart = await Cart.findById(cartStore.cart_id);
//             if (cart) {
//                 await cart.save();
//             }
//         }
//     }
// }

cartItemSchema.pre("save", async function (next) {
  // Set finalPrice tạm thời nếu chưa có
  if (
    !this.finalPrice ||
    this.isModified("quantity") ||
    this.isModified("unitPrice")
  ) {
    this.finalPrice = this.unitPrice * this.quantity;
  }
  next();
});

// Sau khi save, gọi applyPromotionsToItems
cartItemSchema.post("save", async function (doc) {
  try {
    const CartStore = mongoose.model("CartStore");
    const store = await CartStore.findById(doc.cartStore_id);

    if (store && store.onDeploy === false) {
      store.onDeploy = true;
      await store.save();
    }

    if (store && store.cart_id) {
      // applyPromotionsToItems sẽ update lại finalPrice với discount
      await applyPromotionsToItems(store.cart_id, store._id);
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật promotion:", err);
  }
});
cartItemSchema.pre("updateMany", async function (next) {
  const update = this.getUpdate();

  // Nếu unitPrice hoặc quantity được update thì tính lại finalPrice
  if (update.unitPrice != null || update.quantity != null) {
    update.finalPrice = update.unitPrice * update.quantity;
    this.setUpdate(update); // cập nhật lại cho query
  }

  try {
    // Lấy các document bị ảnh hưởng để áp dụng promotion
    const CartItem = mongoose.model("CartItem");
    const items = await CartItem.find(this.getQuery()); // các item bị update

    const CartStore = mongoose.model("CartStore");
    for (const item of items) {
      const store = await CartStore.findById(item.cartStore_id);
      if (store && store.cart_id) {
        await applyPromotionsToItems(store.cart_id, store._id);
      }
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật promotion:", err);
  }
  next();
});

cartItemSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    this._cartStore_id_temp = this.cartStore_id;
    this._id_temp = this._id;
    next();
  }
);

cartItemSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function (doc) {
    try {
      const CartStore = mongoose.model("CartStore");
      const CartItem = mongoose.model("CartItem");
      const store = await CartStore.findById(doc._cartStore_id_temp);
      if (store && store.cart_id) {
        const remainingItems = await CartItem.countDocuments({
          cartStore_id: store._id,
        });
        if (remainingItems === 0) {
                // Không còn item nào → store "chết"
                console.log("Store will be set to onDeploy=false");
                store.onDeploy = false;
                store.subTotal = 0;
                store.finalTotal = 0;
                store.promotion = null;
                await store.save({ validateBeforeSave: false });
                await applyPromotionsToItems(store.cart_id);
            } else {
                // Vẫn còn items → tính lại promotion
                console.log("Recalculating promotions...");
                await applyPromotionsToItems(store.cart_id, store._id);
            }
        }
    } catch (err) {
      console.error("Lỗi khi cập nhật sau khi xóa item:", err);
    }
  }
);
const CartItemModel = mongoose.model("CartItem", cartItemSchema);
export default CartItemModel;
