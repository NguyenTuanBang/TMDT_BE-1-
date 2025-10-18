import User from "../models/UserModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Address from "../models/AddressModel.js";
import cloudinary from "../utils/cloudinary.js";

const userController = {
  getMe: catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      status: "success",
      data: { user },
    });
  }),

  updateMe: catchAsync(async (req, res, next) => {
    const allowedFields = ["fullname", "phone"];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field]) updateData[field] = req.body[field];
    });

    const file = req.file;

    if (file) {
      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;
      const fileName = `${req.user.id}_${Date.now()}`;
      
      const result = await cloudinary.uploader.upload(dataUrl, {
        public_id: fileName,
        folder: "avatars",
        resource_type: "auto",
      });
      console.log("false")
      console.log("true")
      updateData.avatar = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  }),

  getAddresses: catchAsync(async (req, res, next) => {
    const addresses = await Address.find({ user: req.user.id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      status: "success",
      results: addresses.length,
      data: addresses,
    });
  }),

  addAddress: catchAsync(async (req, res, next) => {
    const { name, phone, province, district, ward, detail } = req.body;
    const count = await Address.countDocuments({ user: req.user.id });

    const address = await Address.create({
      user: req.user.id,
      name,
      phone,
      province,
      district,
      ward,
      detail,
      isDefault: count === 0,
    });

    res.status(201).json({
      status: "success",
      data: { address },
    });
  }),

  setAddressDefault: catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, user: req.user.id });

    if (!address) {
      return next(new AppError("Không tìm thấy địa chỉ này", 404));
    }

    await Address.updateMany(
      { user: req.user.id, _id: { $ne: id } },
      { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();

    res.status(200).json({
      status: "success",
      data: { address },
    });
  }),

  deleteAddress: catchAsync(async (req, res, next) => {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return next(new AppError("Không tìm thấy địa chỉ này", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  }),

  updateAddress: catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, phone, province, district, ward, detail } = req.body;

    const address = await Address.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { name, phone, province, district, ward, detail },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!address) {
      return next(new AppError("Không tìm thấy địa chỉ này", 404));
    }

    res.status(200).json({
      status: "success",
      data: { address },
    });
  }),
};

export default userController;
