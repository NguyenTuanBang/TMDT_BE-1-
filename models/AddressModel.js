import e from "express";
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    phone: String,
    province: String,
    district: String,
    ward: String,
    detail: String,
    isDefault: { type: Boolean, default: false },
    onDeploy: {type: Boolean, default: true },
    lat: Number,
    lng: Number
  },
  {
    timestamps: true,
  }
);

const AddressModel = mongoose.model("Address", addressSchema);
export default AddressModel;