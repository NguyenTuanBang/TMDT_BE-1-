import mongoose from "mongoose";
import CartItemModel from "../models/CartItemModel.js";
import CartModel from "../models/CartModel.js";
import CartStoreModel from "../models/CartStoreModel.js";
import OrderItemModel from "../models/OrderItemModel.js";
import OrderModel from "../models/OrderModel.js";
import OrderStoreModel from "../models/OrderStoreModel.js";
import AuditLogModel from "../models/AuditLogModel.js";
import ProductVariantsModel from "../models/product_variantsModel.js";
import ProductModel from "../models/ProductModel.js";

const OrderController = {
  // 🛒 Tạo đơn hàng
  createOrder: async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) return res.status(400).send({ message: "Missing address" });

      const user = req.user;
      const cart = await CartModel.findOne({ user: user._id });
      const storeCart = await CartStoreModel.find({ cart_id: cart._id });

      const storeItems = await Promise.all(
        storeCart.map(async (store) => {
          const items = await CartItemModel.find({
            cartStore_id: store._id,
            is_chosen: true,
          });
          return { store, items };
        })
      );

      const validStores = storeItems.filter(({ items }) => items.length > 0);
      if (validStores.length === 0) {
        return res.status(400).send({ message: "No items selected for order" });
      }

      const order = await OrderModel.create({
        contact: address,
        total_amount: cart.subTotal,
        final_amount: cart.finalTotal,
        promotion: cart.promotion,
        shippingFee: cart.shippingFee,
      });

      const promotionGlobal = await ProductModel.findById(order.promotion);
      if (promotionGlobal) {
        promotionGlobal.quantity = Math.max(0, promotionGlobal.quantity - 1);
        await promotionGlobal.save();
      }

      await Promise.all(
        validStores.map(async ({ store, items }) => {
          const storeOrder = await OrderStoreModel.create({
            order_id: order._id,
            store: store.store_id,
            promotion: store.promotion,
            shippingFee: store.shippingFee,
            subTotal: store.subTotal,
            finalTotal: store.finalTotal,
          });

          const promotionStore = await ProductModel.findById(store.promotion);
          if (promotionStore) {
            promotionStore.quantity = Math.max(0, promotionStore.quantity - 1);
            await promotionStore.save();
          }

          await Promise.all(
            items.map(async (item) => {
              await OrderItemModel.create({
                storeOrder: storeOrder._id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                finalPrice: item.finalPrice,
              });

              const cartItem = await CartItemModel.findById(item._id);
              const variant = await ProductVariantsModel.findById(item.variant_id);
              variant.quantity = Math.max(0, variant.quantity - item.quantity);
              const product = await ProductModel.findById(variant.product_id);
              product.tradedCount = (product.tradedCount || 0) + item.quantity;
              await product.save();
              await variant.save();
              await cartItem.deleteOne();
            })
          );
        })
      );

      await AuditLogModel.create({
        entity_type: "Order",
        entity_id: order._id,
        action: "create",
        changes: [],
        performedBy: user._id,
      });

      res.status(200).send({ message: "Success" });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  // 🚫 Hủy item trong đơn
  cancelOrder: async (req, res) => {
    try {
      const user = req.user;
      const { orderItemId } = req.body;
      const orderItem = await OrderItemModel.findById(orderItemId);
      orderItem.status = "CANCELLED";
      await orderItem.save();

      await AuditLogModel.create({
        action: "update",
        entity_id: orderItem._id,
        entity_type: "Order",
        changes: [
          { field: "status", oldValue: "Pending", newValue: "Cancelled" },
        ],
        performedBy: user._id,
      });

      res.status(200).send({ message: "Success" });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  // 📦 Lấy toàn bộ đơn hàng (aggregate)
  getOrders: async (req, res) => {
    try {
      const order = await OrderModel.aggregate([
        {
          $lookup: {
            from: "addresses",
            localField: "contact",
            foreignField: "_id",
            as: "contact",
          },
        },
        { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "orderstores",
            let: { oid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },
              {
                $lookup: {
                  from: "stores",
                  let: { sid: "$store" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$sid"] } } },
                    {
                      $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user",
                      },
                    },
                    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                    {
                      $project: {
                        _id: 1,
                        name: 1,
                        user: { _id: "$user._id", avatar: "$user.avatar" },
                      },
                    },
                  ],
                  as: "store",
                },
              },
              { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "orderitems",
                  let: { osid: "$_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$storeOrder", "$$osid"] } } },
                    {
                      $lookup: {
                        from: "productvariants",
                        let: { vid: "$variant_id" },
                        pipeline: [
                          { $match: { $expr: { $eq: ["$_id", "$$vid"] } } },
                          {
                            $lookup: {
                              from: "products",
                              localField: "product_id",
                              foreignField: "_id",
                              as: "product_id",
                            },
                          },
                          { $unwind: { path: "$product_id", preserveNullAndEmptyArrays: true } },
                          {
                            $lookup: {
                              from: "images",
                              localField: "image",
                              foreignField: "_id",
                              as: "image",
                            },
                          },
                          { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
                          {
                            $lookup: {
                              from: "sizes",
                              localField: "size",
                              foreignField: "_id",
                              as: "size",
                            },
                          },
                          { $unwind: { path: "$size", preserveNullAndEmptyArrays: true } },
                        ],
                        as: "variant_id",
                      },
                    },
                    { $unwind: { path: "$variant_id", preserveNullAndEmptyArrays: true } },
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
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  },

  // 🧾 Lấy đơn hàng theo userId (lọc)
  getOneOrders: async (req, res) => {
    try {
      const orders = await OrderModel.aggregate([
        {
          $lookup: {
            from: "addresses",
            localField: "contact",
            foreignField: "_id",
            as: "contact",
          },
        },
        { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "orderstores",
            let: { oid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },
            ],
            as: "orderStore",
          },
        },
      ]);

      const { userId } = req.params;
      const order = orders.filter(
        (order) => order.contact.user.toString() === userId
      );

      res
        .status(200)
        .send({ message: "Success", length: order.length, data: order });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  // 📜 Lấy danh sách đơn theo user (ngắn gọn)
  getOrder: async (req, res) => {
    try {
      const { userId } = req.params;

      const pipeline = [
        {
          $lookup: {
            from: "addresses",
            localField: "contact",
            foreignField: "_id",
            as: "contact",
          },
        },
        { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "contact.user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      ];

      if (userId) {
        pipeline.push({
          $match: {
            "user._id": new mongoose.Types.ObjectId(userId),
          },
        });
      }

      const orders = await OrderModel.aggregate(pipeline);
      res.status(200).json({ message: "Success", data: orders });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

export default OrderController;
