// import { pipeline } from "nodemailer/lib/xoauth2";
import AddressModel from "./models/AddressModel.js";
import OrderModel from "./models/OrderModel.js";

const test = {
  getOrderItem: async (req, res) => {
    const user = req.user;
    const addressIds = await AddressModel.distinct("_id", { user: user._id });
    const order = await OrderModel.aggregate([
      {
        $match: { contact: { $in: addressIds } },
      },

      // === Lấy thông tin địa chỉ ===
      {
        $lookup: {
          from: "addresses",
          localField: "contact",
          foreignField: "_id",
          as: "contact",
        },
      },
      { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },

      // === Lookup các orderStore thuộc order này ===
      {
        $lookup: {
          from: "orderstores",
          let: { oid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },

            // 🔹 Lookup store (vì store nằm ở orderStore)
            {
              $lookup: {
                from: "stores",
                let: { sid: "$store" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$sid"] } } },

                  // lookup chủ store
                  {
                    $lookup: {
                      from: "users",
                      localField: "user",
                      foreignField: "_id",
                      as: "user",
                    },
                  },
                  {
                    $unwind: {
                      path: "$user",
                      preserveNullAndEmptyArrays: true,
                    },
                  },

                  // chỉ lấy trường cần
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      user: {
                        _id: "$user._id",
                        avatar: "$user.avatar",
                      },
                    },
                  },
                ],
                as: "store",
              },
            },
            { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },

            // 🔹 Lookup orderItem thuộc orderStore
            {
              $lookup: {
                from: "orderitems",
                let: { osid: "$_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$storeOrder", "$$osid"] } } },

                  // === lookup variant ===
                  {
                    $lookup: {
                      from: "productvariants",
                      let: { vid: "$variant_id" },
                      pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$vid"] } } },

                        // Lấy product (chỉ tên)
                        {
                          $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "product_id",
                          },
                        },
                        {
                          $unwind: {
                            path: "$product_id",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                        {
                          $project: {
                            _id: 1,
                            size: 1,
                            price: 1,
                            product_id: { name: "$product_id.name" },
                            image: 1,
                          },
                        },

                        // Lấy image (chỉ url, color)
                        {
                          $lookup: {
                            from: "images",
                            localField: "image",
                            foreignField: "_id",
                            as: "image",
                          },
                        },
                        {
                          $unwind: {
                            path: "$image",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                        {
                          $project: {
                            product_id: 1,
                            size: 1,
                            price: 1,
                            image: {
                              url: "$image.url",
                              color: "$image.color",
                            },
                          },
                        },

                        // Lấy size (toàn bộ)
                        {
                          $lookup: {
                            from: "sizes",
                            localField: "size",
                            foreignField: "_id",
                            as: "size",
                          },
                        },
                        {
                          $unwind: {
                            path: "$size",
                            preserveNullAndEmptyArrays: true,
                          },
                        },
                      ],
                      as: "variant_id",
                    },
                  },
                  {
                    $unwind: {
                      path: "$variant_id",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ],
                as: "orderItem",
              },
            },
          ],
          as: "orderStore",
        },
      },
    ]);

    res.status(200).send({ message: "Success", data: order });
  },
  getOrder: async (req, res) => {
    const orders = await OrderModel.aggregate([
        {
            $lookup: {
                from: "addresses",
                localField: "contact",
                foreignField: "_id",
                as: "contact",
            },
        },
        {
            $unwind: { path: "$contact", preserveNullAndEmptyArrays: true }
        },
        {
            $lookup: {
                from: "users",
                localField: "contact.user",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $unwind: { path: "$user", preserveNullAndEmptyArrays: true }
        }
    ]);
    res.status(200).send({ message: "Success", data: orders });
  }
};
export default test;

