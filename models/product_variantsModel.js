import mongoose from "mongoose";

const productVariantsSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        required: true
    },
    size: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Size',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true
    },
    onDeploy: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hàm helper để update CartItem khi giá variant thay đổi
async function updateCartItems(doc) {
    if (doc) {
        await mongoose.model("CartItem").updateMany(
            { variant_id: doc._id },
            [
                {
                    $set: {
                        unitPrice: doc.price,
                        finalPrice: { $multiply: ["$quantity", doc.price] },
                    },
                },
            ]
        );
    }
}

// Trigger sau khi update bằng findOneAndUpdate
productVariantsSchema.post("findOneAndUpdate", async function (doc) {
    await updateCartItems(doc);
});

// Trigger sau khi save (create hoặc save thủ công)
productVariantsSchema.post("save", async function (doc) {
    await updateCartItems(doc);
});

productVariantsSchema.pre("save", async function (next) {
    if(this.quantity===0) this.onDeploy=false
    const cart_item = mongoose.model("CartItem")
    if(this.onDeploy===false){
        await cart_item.find({variant_id: this._id})
        cart_item.is_out_of_stock = true
        cart_item.quantity = 0
        cart_item.is_chosen = false
        await cart_item.save()
    }
    next()
})

const ProductVariantsModel = mongoose.model("ProductVariants", productVariantsSchema);
export default ProductVariantsModel;
