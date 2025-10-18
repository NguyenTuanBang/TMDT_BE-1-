import StoreModel from "../models/StoreModel";
import ProductModel from "../models/ProductModel.js";
import UserModel from "../models/UserModel.js";
import AreaModel from "../models/AreaModel.js";
import mongoose from "mongoose";


const storeController = {
  getStoreInfo: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;


      const productCount = await ProductModel.countDocuments({
        store_id: new mongoose.Types.ObjectId(id),
      });
      const numberOfPages = Math.ceil(productCount / 10);

      const storeData = await StoreModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },

        // join owner
        {
          $lookup: {
            from: "user",
            localField: "owner_id",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },

        // ẩn các field nhạy cảm của owner
        {
          $project: {
            "owner.password": 0,
            "owner.role": 0,
            "owner.__v": 0,
            "owner.createdAt": 0,
            "owner.updatedAt": 0,
          },
        },

        // join area
        {
          $lookup: {
            from: "area",
            localField: "area",
            foreignField: "_id",
            as: "area",
          },
        },
        { $unwind: { path: "$area", preserveNullAndEmptyArrays: true } },
      ]);

      if (!storeData || storeData.length === 0) {
        return res.status(404).send({ message: "Store not found" });
      }

      // Lấy danh sách products của store
      const products = await ProductModel.aggregate([
        { $match: { store_id: new mongoose.Types.ObjectId(id) } },
        { $skip: (page - 1) * 10 },
        { $limit: 10 },

        // join mainImage giống productController
        {
          $lookup: {
            from: "image",
            let: { pid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$productId", "$$pid"] } } },
            ],
            as: "images",
          },
        },
        { $addFields: { images: "$images" } },
      ]);

      res.status(200).send({
        message: "Success",
        data: storeData,
        products,
        numberOfPages,
      });
    } catch (error) {
      res.status(500).send({ message: "Error", error: error.message });
    }
  },
};

export default storeController;
