import Store from "../models/StoreModel.js";
import User from "../models/UserModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import ReplyModel from "../models/ReplyModel.js";

const storeController = {
  createStore: catchAsync(async (req, res, next) => {
    const existingStore = await Store.findOne({ user: req.user._id , status: { $in: ["pending", "approved"] } });
    if (existingStore) {
      return next(new AppError("Bạn chỉ được đăng ký cửa hàng 1 lần", 400));
    }

    // const address = `${req.body.detail}, ${req.body.ward}, ${req.body.district}, ${req.body.province}`;
    // console.log(address);
    // console.log(req.body);

    const store = await Store.create({
      user: req.user._id,
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      citizenCode: req.body.citizenCode,
      citizenImageFront: req.files?.citizenImageFront?.[0]?.path,
      citizenImageBack: req.files?.citizenImageBack?.[0]?.path,
    });

    res.status(201).json({
      status: "success",
      data: store,
    });
  }),

  getStores: catchAsync(async (req, res, next) => {
    const stores = await Store.find().populate("user").sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      results: stores.length,
      data: stores,
    });
  }),

  getPendingStores: catchAsync(async (req, res, next) => {
    const pendingStores = await Store.find({ status: "pending" })
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: pendingStores.length,
      data: pendingStores,
    });
  }),

  approveStore: catchAsync(async (req, res, next) => {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!store) return next(new AppError("Store not found", 404));

    await User.findByIdAndUpdate(store.user, { role: "seller" });

    res.status(200).json({ status: "success", data: store });
  }),

  rejectStore: catchAsync(async (req, res, next) => {
    const {reply} = req.body;
    const from = req.user._id;
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
  
    if (!store) return next(new AppError("Store not found", 404));
    // Gửi thông báo từ chối đến người dùng
    const notification = {
      content: `Cửa hàng của bạn đã bị từ chối. Lý do: ${reply || 'Không có lý do cụ thể'}`,
      to: store.user,
      from,
      about: 'store'
    };
    await ReplyModel.create(notification);
    res.status(200).json({ status: "success", data: store });
  }),
};

export default storeController;
