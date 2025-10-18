import mongoose from "mongoose";

const OrderStoreSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Order"
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Store"
    },
    shippingFee:{
        type: Number
    },
    promotion:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion"
    },
    subTotal:{
        type: Number
    },
    finalTotal:{
        type: Number
    }
},{
    timestamps: true
})

const OrderStoreModel = mongoose.model("OrderStore", OrderStoreSchema);
export default OrderStoreModel;
