import mongoose from "mongoose";
import ProductModel from "../models/ProductModel.js";
// import { v2 as cloudinary } from "cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StoreModel from "../models/StoreModel.js";
import ProductVariantsModel from "../models/product_variantsModel.js";
import ImageModel from "../models/imageModel.js";
import SizeModel from "../models/sizeModel.js";
import ProductTagsModel from "../models/ProductTagsModel.js";
import removeVietnameseTones from "../utils/removeVietnameseTones.js";
const commonLookups = [
  // join store
  {
    $lookup: {
      from: "stores",
      localField: "store_id",
      foreignField: "_id",
      as: "store",
      pipeline: [
        {
          $project: {
            _id: 1,
            name: 1,
          },
        },
      ],
    },
  },
  { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },

  // join tags
  {
    $lookup: {
      from: "producttags",
      let: { cid: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$product_id", "$$cid"] } } },
        {
          $lookup: {
            from: "tags",
            localField: "tag_id",
            foreignField: "_id",
            as: "tag",
          },
        },
        { $unwind: { path: "$tag", preserveNullAndEmptyArrays: true } },
      ],
      as: "producttags",
    },
  },
  {
    $lookup: {
      from: "productvariants",
      let: { pvid: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$product_id", "$$pvid"] } } },
        {
          $lookup: {
            from: "images",
            localField: "image",
            foreignField: "_id",
            as: "image",
          },
        },
        {
          $lookup: {
            from: "sizes",
            localField: "size",
            foreignField: "_id",
            as: "size",
          },
        },
        { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$size", preserveNullAndEmptyArrays: true } },
      ],
      as: "variants",
    },
  },
];

const productController = {
  // isRun: (req, res, next) => {
  //   const file = req.files;
  //   console.log(file);
  //   next();
  // },
  createNewProduct: async (req, res) => {
    try {
      const user = req.user;
      const store = await StoreModel.findOne({ user: user._id });
      const { name, description } = req.body;
      const newProduct = await ProductModel.create({
        name,
        description,
        store_id: store._id,
      });
      let variants = [];
      if (req.body.variants) {
        variants = JSON.parse(req.body.variants);
      }
      let tags = [];
      if (req.body.tags) {
        tags = JSON.parse(req.body.tags);
      }
      await Promise.all(
        tags.map(async (tagId) => {
          await ProductTagsModel.create({
            product_id: newProduct._id,
            tag_id: tagId,
          });
        })
      );
      const uploadedImages = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) throw new AppError("Upload ảnh thất bại", 400);
            uploadedImages.push(result.secure_url);
          }
        );

        await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) reject(error);
              else {
                uploadedImages.push(result.secure_url);
                resolve(result);
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      }

      variants.forEach((variant) => {
        const idx = variant.urlIndex;
        if (uploadedImages[idx]) {
          variant.image = uploadedImages[idx];
        }
      });

      await Promise.all(
        variants.map(async (color) => {
          const image = await ImageModel.create({
            url: color.image,
            color: color.color,
          });
          await Promise.all(
            color.sizes.map(async (size) => {
              const newSize = await SizeModel.create({
                size_value: size.size,
              });
              const variant = await ProductVariantsModel.create({
                product_id: newProduct._id,
                image: image._id,
                size: newSize._id,
                quantity: size.quantity,
                price: size.price,
              });
            })
          );
        })
      );
      res.status(201).json({
        status: "success",
      });
    } catch (err) {
      console.error("❌ createNewProduct error:", err);
      return next(new AppError("Tạo sản phẩm thất bại", 500));
    }
  },

  // getAll: async (req, res) => {
  //   try {
  //     const curPage = parseInt(req.query.page) || 1;
  //     const {keyword, tag, price} = req.body;
  //     const query = { status: "Đang bán" };

  //     // Đếm tổng số sản phẩm đang bán
  //     const totalItems = await ProductModel.countDocuments(query);
  //     const numberOfPages = Math.ceil(totalItems / 20);

  //     if (curPage > numberOfPages && numberOfPages > 0) {
  //       return res.status(400).json({ message: "Invalid page number" });
  //     }

  //     // Lấy dữ liệu gốc trong trang hiện tại
  //     const data = await ProductModel.aggregate([
  //       { $match: query },
  //       ...commonLookups,
  //       { $skip: (curPage - 1) * 20 },
  //       { $limit: 20 },
  //     ]);

  //     // Nếu có từ khóa → lọc theo phiên bản không dấu
  //     let filteredData = data;
  //     if (keyword) {
  //       const keywordUnsigned = removeVietnameseTones(keyword.toLowerCase());
  //       filteredData = data.filter((item) => {
  //         const productNameUnsigned = removeVietnameseTones(
  //           item.name.toLowerCase()
  //         );
  //         return productNameUnsigned.includes(keywordUnsigned);
  //       });
  //     }

  //     res.status(200).json({
  //       message: "Success",
  //       data: filteredData,
  //       numberOfPages,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ message: "Error", error: error.message });
  //   }
  // },
  getAll: async (req, res) => {
    try {
      const curPage = parseInt(req.query.page) || 1;
      const pageSize = 20;

      const { keyword = "", tag = [], price = {} } = req.body || {};

      const baseMatch = { status: "Đang bán" };

      const skip = (curPage - 1) * pageSize;

      // 🔹 Bước 1: Xây pipeline gốc
      const pipeline = [{ $match: baseMatch }, ...commonLookups];

      // 🔹 Bước 2: Lọc theo tag nếu có
      if (Array.isArray(tag) && tag.length > 0) {
        const tagIds = tag.map((t) => new mongoose.Types.ObjectId(t));
        pipeline.push({
          $match: {
            "producttags.tag._id": { $in: tagIds },
          },
        });
      }

      // 🔹 Bước 3: Lọc theo khoảng giá — nếu có ít nhất 1 variant nằm trong khoảng
      if (price.min || price.max) {
        const priceFilter = {};
        if (price.min) priceFilter.$gte = Number(price.min);
        if (price.max) priceFilter.$lte = Number(price.max);

        pipeline.push({
          $match: {
            "variants.price": priceFilter,
          },
        });
      }

      // 🔹 Bước 4: Gom nhóm để loại trùng (do join nhiều bảng)
      pipeline.push({
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
        },
      });

      // 🔹 Bước 5: Lọc theo keyword không dấu (nếu có)
      let data = await ProductModel.aggregate(pipeline);

      if (keyword && keyword.trim() !== "") {
        const keywordUnsigned = removeVietnameseTones(keyword.toLowerCase());
        data = data.filter((item) => {
          const productNameUnsigned = removeVietnameseTones(
            item.doc.name.toLowerCase()
          );
          return productNameUnsigned.includes(keywordUnsigned);
        });
      }

      // 🔹 Bước 6: Tính tổng & phân trang
      const totalItems = data.length;
      const numberOfPages = Math.ceil(totalItems / pageSize);
      const paginatedData = data.slice(skip, skip + pageSize);

      res.status(200).json({
        message: "Success",
        data: paginatedData.map((d) => d.doc),
        numberOfPages,
      });
    } catch (error) {
      console.error("Error in getAll:", error);
      res.status(500).json({ message: "Error", error: error.message });
    }
  },

  getOneProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await ProductModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id), status: "Đang bán" },
        },
        ...commonLookups,
      ]);

      if (!data || data.length === 0) {
        return res.status(404).send({ message: "Product not found" });
      }

      res.status(200).send({ message: "Success", data: data[0] });
    } catch (error) {
      res.status(500).send({ message: "Error", error: error.message });
    }
  },

  getMostFavourite: async (req, res) => {
    try {
      const data = await ProductModel.aggregate([
        { $match: { status: "Đang bán" } },
        { $sort: { traded_count: -1 } },
        { $limit: 10 },
        ...commonLookups,
      ]);

      res.status(200).send({ message: "Success", data });
    } catch (error) {
      res.status(500).send({ message: "Error", error: error.message });
    }
  },

  getTopRating: async (req, res) => {
    try {
      const data = await ProductModel.aggregate([
        { $match: { status: "Đang bán" } },
        { $sort: { curRating: -1 } },
        { $limit: 10 },
        ...commonLookups,
      ]);

      res.status(200).send({ message: "Success", data });
    } catch (error) {
      res.status(500).send({ message: "Error", error: error.message });
    }
  },

  searchByName: async (req, res) => {
    try {
      const { keyword } = req.query;
      if (!keyword)
        return res.status(400).send({ message: "Keyword required" });

      const regex = { $regex: keyword, $options: "i" };
      const totalResults = await ProductModel.countDocuments({ name: regex });

      const data = await ProductModel.aggregate([
        { $match: { name: regex, status: "Đang bán" } },
        { $limit: 5 },
        ...commonLookups,
        { $addFields: { mainImage: { $first: "$variants.image" } } },
        { $project: { name: 1, mainImage: 1 } },
      ]);

      if (data.length === 0) {
        return res.status(200).send({ message: "Not Found", data: [] });
      }

      res.status(200).send({ message: "Success", data, totalResults });
    } catch (error) {
      res.status(500).send({ message: "Error", error: error.message });
    }
  },

  getByPriceRange: async (req, res) => {
    try {
      const { min, max } = req.query;
      const curPage = parseInt(req.query.curPage) || 1;
      const rangeQuery = {
        base_price: {
          $gte: parseFloat(min) || 0,
          $lte: parseFloat(max) || Number.MAX_SAFE_INTEGER,
        },
      };

      const itemQuantity = await ProductModel.countDocuments(rangeQuery);
      const numberOfPages = Math.ceil(itemQuantity / 20);

      const data = await ProductModel.aggregate([
        { $match: { ...rangeQuery, status: "Đang bán" } },
        ...commonLookups,
        { $skip: (curPage - 1) * 20 },
        { $limit: 20 },
      ]);

      res.status(200).send({ message: "Success", data, numberOfPages });
    } catch (error) {
      res.status(500).send({ message: "Error", error: error.message });
    }
  },

  getByStore: async (req, res) => {
    try {
      const { storeId } = req.params;
      const curPage = parseInt(req.query.curPage) || 1;

      const itemQuantity = await ProductModel.countDocuments({
        store_id: new mongoose.Types.ObjectId(storeId),
      });
      const numberOfPages = Math.ceil(itemQuantity / 20);

      const data = await ProductModel.aggregate([
        {
          $match: {
            store_id: new mongoose.Types.ObjectId(storeId),
            status: "Đang bán",
          },
        },
        ...commonLookups,
        { $skip: (curPage - 1) * 20 },
        { $limit: 20 },
      ]);

      res.status(200).send({ message: "Success", data, numberOfPages });
    } catch (error) {
      res.status(500).send({ message: "Error", error: error.message });
    }
  },
};

export default productController;
