import mongoose from "mongoose";
import OrderStoreModel from "./OrderStoreModel.js";
import OrderModel from "./OrderModel.js";

const OrderItemSchema = new mongoose.Schema({
    storeOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderStore',
        required: true
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariants',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    finalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    }
},{
    timestamps:true
});

// Middleware chạy sau khi lưu item
OrderItemSchema.post("save", async function (doc) {
  try {
    // chỉ xử lý khi item bị CANCELLED hoặc trạng thái thay đổi
    if (doc.status !== "CANCELLED") return;

    const storeOrderId = doc.storeOrder;

    // ==== 1️⃣ Tính lại tổng cho OrderStore ====
    const allItems = await mongoose.model("OrderItem").find({ storeOrder: storeOrderId });

    // chỉ tính các item chưa CANCELLED
    const activeItems = allItems.filter(i => i.status !== "CANCELLED");

    const subTotal = activeItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const finalTotal = activeItems.reduce((sum, i) => sum + i.finalPrice, 0);
    const allCancelled = activeItems.length === 0;

    // Lấy OrderStore hiện tại
    const storeOrder = await OrderStoreModel.findById(storeOrderId);
    if (!storeOrder) return;

    // Nếu toàn bộ item trong cửa hàng bị hủy → shippingFee = 0
    const newShippingFee = allCancelled ? 0 : storeOrder.shippingFee;

    // Cập nhật OrderStore
    storeOrder.subTotal = subTotal;
    storeOrder.finalTotal = finalTotal;
    storeOrder.shippingFee = newShippingFee;
    await storeOrder.save();

    // ==== 2️⃣ Tính lại tổng cho Order ====
    const allStores = await OrderStoreModel.find({ order_id: storeOrder.order_id });

    let total_amount = 0;
    let final_amount = 0;
    let totalShipping = 0;

    for (const s of allStores) {
      total_amount += s.subTotal || 0;
      final_amount += s.finalTotal || 0;
      totalShipping += s.shippingFee || 0;
    }

    await OrderModel.findByIdAndUpdate(storeOrder.order_id, {
      total_amount,
      final_amount,
      shippingFee: totalShipping
    });

  } catch (err) {
    console.error("Error updating order totals after item cancel:", err);
  }
});

const OrderItemModel = mongoose.model("OrderItem", OrderItemSchema);
export default OrderItemModel;
