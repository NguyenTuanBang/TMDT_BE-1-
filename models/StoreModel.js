import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    address: { type: String, required: true },
    name: { type: String, required: true },
    phone: String,
    status: { 
        type: String,
        enum: ["Pending", "Approval", "Reject"],
        default: "Pending"
    },
    citizenCode:{type: String, required: true},
    citizenImageFront : {type: String, required: true},
    citizenImageBack : {type: String, required: true},
    lat: {
        type: Number
    },
    lng:{
        type: Number
    }
}, {
    timestamps: true
})

const StoreModel = mongoose.model('Store', storeSchema);
export default StoreModel;