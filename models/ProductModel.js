import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    description: { type: String, required: true },
    totalRating: { type: Number, default: 0 },
    tradedCount: { type: Number, default: 0 },
    countRating: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    status: {
        type: String,
        enum:["Đang bán", "Ngừng bán"],
        default: "Đang bán"
    }
}, {
    timestamps: true
});

productSchema.pre('save', function(next) {
    if (this.countRating === 0) {
        this.rating = 0;
    } else {
        this.rating = this.totalRating / this.countRating;
    }
    next();
});
productSchema.set('toObject', { virtuals: true });
productSchema.set('toJSON', { virtuals: true });    



const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;
