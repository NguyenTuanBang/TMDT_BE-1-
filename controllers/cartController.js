import e from "express";
import CartModel from "../models/CartModel.js";
import CartItemModel from "../models/CartItemModel.js";
import ProductVariantsModel from "../models/product_variantsModel.js";
import CartStoreModel from "../models/CartStoreModel.js";
import PromotionModel from "../models/PromotionModel.js";
import AddressModel from "../models/AddressModel.js";

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // bán kính Trái Đất (km)

  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  console.log(`Khoảng cách ${R * c}`);

  return R * c; // kết quả là km
}

const CartController = {
  getCart: async (req, res) => {
    try {
      const user = req.user;
      const cart = await CartModel.aggregate([
        { $match: { user: user._id } },
        {
          $lookup: {
            from: "cartstores",
            let: { cid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$cart_id", "$$cid"] },
                      { $eq: ["$onDeploy", true] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "stores",
                  let: { sid: "$store_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$sid"] } } },

                    // lookup sang bảng users để lấy thông tin chủ store
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

                    // chỉ lấy những trường cần thiết
                    {
                      $project: {
                        _id: 1,
                        name: 1,
                        user: {
                          _id: "$user._id",
                          avatar: "$user.avatar", // avatar nằm trực tiếp trong user
                        },
                      },
                    },
                  ],
                  as: "store_id",
                },
              },
              {
                $unwind: {
                  path: "$store_id",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: "cartitems",
                  let: { csid: "$_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$cartStore_id", "$$csid"] } } },

                    {
                      $lookup: {
                        from: "productvariants",
                        let: { pvid: "$variant_id" },
                        pipeline: [
                          { $match: { $expr: { $eq: ["$_id", "$$pvid"] } } },

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

                    // format lại item
                    {
                      $project: {
                        _id: 1,
                        cartStore_id: 1,
                        quantity: 1,
                        variant_id: {
                          _id: "$variant_id._id",
                          product_id: "$variant_id.product_id",
                          image: "$variant_id.image",
                          size: "$variant_id.size",
                          price: "$variant_id.price",
                          quantity: "$variant_id.quantity",
                        },
                        is_chosen: 1,
                        unitPrice: 1,
                        finalPrice: 1,
                        discountValue: 1,
                      },
                    },
                  ],
                  as: "Item",
                },
              },
              {
                $lookup: {
                  from: "promotions",
                  localField: "promotion",
                  foreignField: "_id",
                  as: "promotion",
                },
              },
              {
                $unwind: {
                  path: "$promotion",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // project lại store
              {
                $project: {
                  _id: 1,
                  cart_id: 1,
                  store_id: 1,
                  subTotal: 1,
                  finalTotal: 1,
                  shippingFee: 1,
                  promotion: 1,
                  Item: 1,
                },
              },
            ],
            as: "Store",
          },
        },
        {
          $lookup: {
            from: "promotions",
            localField: "promotion",
            foreignField: "_id",
            as: "promotion",
          },
        },
        { $unwind: { path: "$promotion", preserveNullAndEmptyArrays: true } },

        // cuối cùng format cart
        {
          $project: {
            _id: 1,
            user: 1,
            subTotal: 1,
            shippingFee: 1,
            finalTotal: 1,
            Store: 1,
            promotion: 1,
            Item: 1,
          },
        },
      ]);

      res.status(200).send({
        message: "Success",
        data: cart[0],
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: error.message });
    }
  },
  getPreOrderCart: async (req, res) => {
    try {
      const user = req.user;
      const cart = await CartModel.aggregate([
        { $match: { user: user._id } },
        {
          $lookup: {
            from: "cartstores",
            let: { cid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$cart_id", "$$cid"] },
                      { $eq: ["$onDeploy", true] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "stores",
                  let: { sid: "$store_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$sid"] } } },

                    // lookup sang bảng users để lấy thông tin chủ store
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

                    // chỉ lấy những trường cần thiết
                    {
                      $project: {
                        _id: 1,
                        name: 1,
                        user: {
                          _id: "$user._id",
                          avatar: "$user.avatar", // avatar nằm trực tiếp trong user
                        },
                      },
                    },
                  ],
                  as: "store_id",
                },
              },
              {
                $unwind: {
                  path: "$store_id",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: "cartitems",
                  let: { csid: "$_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$cartStore_id", "$$csid"] } } },
                    { $match: { is_chosen: true } },

                    {
                      $lookup: {
                        from: "productvariants",
                        let: { pvid: "$variant_id" },
                        pipeline: [
                          { $match: { $expr: { $eq: ["$_id", "$$pvid"] } } },

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
                    {
                      $project: {
                        _id: 1,
                        cartStore_id: 1,
                        quantity: 1,
                        variant_id: {
                          _id: "$variant_id._id",
                          product_id: "$variant_id.product_id",
                          image: "$variant_id.image",
                          size: "$variant_id.size",
                          price: "$variant_id.price",
                          quantity: "$variant_id.quantity",
                        },
                        is_chosen: 1,
                        unitPrice: 1,
                        finalPrice: 1,
                        discountValue: 1,
                      },
                    },
                  ],
                  as: "Item",
                },
              },
              {
                $match: {
                  $expr: { $gt: [{ $size: "$Item" }, 0] },
                },
              },
              {
                $lookup: {
                  from: "promotions",
                  localField: "promotion",
                  foreignField: "_id",
                  as: "promotion",
                },
              },
              {
                $unwind: {
                  path: "$promotion",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // project lại store
              {
                $project: {
                  _id: 1,
                  cart_id: 1,
                  store_id: 1,
                  subTotal: 1,
                  finalTotal: 1,
                  shippingFee: 1,
                  promotion: 1,
                  Item: 1,
                },
              },
            ],
            as: "Store",
          },
        },
        {
          $lookup: {
            from: "promotions",
            localField: "promotion",
            foreignField: "_id",
            as: "promotion",
          },
        },
        { $unwind: { path: "$promotion", preserveNullAndEmptyArrays: true } },

        // cuối cùng format cart
        {
          $project: {
            _id: 1,
            user: 1,
            subTotal: 1,
            shippingFee: 1,
            finalTotal: 1,
            Store: 1,
            promotion: 1,
            Item: 1,
          },
        },
      ]);

      res.status(200).send({
        message: "Success",
        data: cart[0],
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: error.message });
    }
  },
  addToCart: async (req, res) => {
    try {
      const user = req.user;
      const { variant_id, quantity } = req.body;

      // Validate input
      if (!variant_id || quantity < 1) {
        return res.status(400).send({ message: "Missing required fields" });
      }
      let product = await ProductVariantsModel.findOne({
        _id: variant_id,
        onDeploy: true,
      }).populate({ path: "product_id", select: "store_id" });
      if (!product)
        return res.status(404).send({ message: "Product not found!" });
      // Find or create cart for user
      let cart = await CartModel.findOne({ user: user._id });
      if (!cart) {
        cart = await CartModel.create({ user: user._id });
      }
      let cart_store = await CartStoreModel.findOne({
        cart_id: cart._id,
        store_id: product.product_id.store_id,
      });
      if (!cart_store) {
        cart_store = await CartStoreModel.create({
          cart_id: cart._id,
          store_id: product.product_id.store_id,
        });
      }
      let cart_item = await CartItemModel.findOne({
        cartStore_id: cart_store._id,
        variant_id: variant_id,
      });
      if (cart_item) {
        cart_item.quantity = Math.min(
          cart_item.quantity + quantity,
          product.quantity
        );
        await cart_item.save();
      } else {
        cart_item = await CartItemModel.create({
          cartStore_id: cart_store._id,
          variant_id: variant_id,
          quantity: quantity,
          unitPrice: product.price,
        });
      }

      res
        .status(200)
        .send({ message: "Item added to cart", cart, id: cart_item._id });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: error.message });
    }
  },
  buyNow: async (req, res) => {
    try {
      const user = req.user;
      const { variant_id, quantity } = req.body;

      // Validate input
      if (!variant_id || quantity < 1) {
        return res.status(400).send({ message: "Missing required fields" });
      }
      let product = await ProductVariantsModel.findOne({
        _id: variant_id,
        onDeploy: true,
      }).populate({ path: "product_id", select: "store_id" });
      if (!product)
        return res.status(404).send({ message: "Product not found!" });
      // Find or create cart for user
      let cart = await CartModel.findOne({ user: user._id });
      if (!cart) {
        cart = await CartModel.create({ user: user._id });
      }
      let cart_store = await CartStoreModel.findOne({
        cart_id: cart._id,
        store_id: product.product_id.store_id,
      });
      if (!cart_store) {
        cart_store = await CartStoreModel.create({
          cart_id: cart._id,
          store_id: product.product_id.store_id,
        });
      }
      let cart_item = await CartItemModel.findOne({
        cartStore_id: cart_store._id,
        variant_id: variant_id,
      });
      if (cart_item) {
        cart_item.quantity = Math.min(
          cart_item.quantity + quantity,
          product.quantity
        );
        cart_item.is_chosen = true;
        await cart_item.save();
      } else {
        cart_item = await CartItemModel.create({
          cartStore_id: cart_store._id,
          variant_id: variant_id,
          quantity: quantity,
          unitPrice: product.price,
          is_chosen: true,
        });
      }
      res
        .status(200)
        .send({ message: "Item added to cart", cart, id: cart_item._id });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: error.message });
    }
  },
  increaseFromCart: async (req, res) => {
    try {
      const user = req.user;
      const { cartItemId } = req.body;
      if (!cartItemId) {
        return res.status(400).send({ message: "Missing cartItemId" });
      }
      const cartItem = await CartItemModel.findById(cartItemId);
      cartItem.quantity++;
      await cartItem.save();
      res.status(200).send({ message: "Success" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
  reduceFromCart: async (req, res) => {
    try {
      const user = req.user;
      const { cartItemId } = req.body;
      if (!cartItemId) {
        return res.status(400).send({ message: "Missing cartItemId" });
      }
      const cartItem = await CartItemModel.findById(cartItemId);
      cartItem.quantity--;
      await cartItem.save();
      res.status(200).send({ message: "Item removed from cart" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
  removeFromCart: async (req, res) => {
    try {
      console.log("REMOVE FROM CART - Request body:", req.body);
      const { cartItemId } = req.body;
      if (!cartItemId)
        return res.status(400).send({ message: "Missing cartItemId" });

      const item = await CartItemModel.findById(cartItemId);
      console.log("Item found:", item?._id, "CartStore:", item?.cartStore_id);

      if (!item) {
        return res.status(404).send({ message: "Item not found" });
      }

      await item.deleteOne();
      console.log("Item deleted successfully");
      res.status(200).send({ message: "Item removed from cart" });
    } catch (error) {
      console.error("ERROR in removeFromCart:", error);
      return res.status(500).send({ message: error.message });
    }
  },
  changeCartItemState: async (req, res) => {
    try {
      const user = req.user;
      const { cartItemId, is_chosen } = req.body;
      if (!cartItemId) {
        return res.status(400).send({ message: "Missing cartItemId" });
      }
      const cartItem = await CartItemModel.findById(cartItemId);
      cartItem.is_chosen = is_chosen;
      await cartItem.save();
      res.status(200).send({ message: "Success" });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
  addPromotion: async (req, res) => {
    try {
      const user = req.user;
      const { promotion_id } = req.body;
      const promo = await PromotionModel.findById(promotion_id);
      if (!promo) return res.status(404).send({ message: "Not Found" });
      const cart = await CartModel.findOne({ user: user._id });
      if (promo.scope === "global") {
        cart.promotion = promotion_id;
        await cart.save();
      } else if (promo.scope === "store") {
        const cartStore = await CartStoreModel.findOne({ cart_id: cart._id });
        cartStore.promotion = promotion_id;
        await cartStore.save();
      }
      res.status(200).send({ message: "Success" });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
  checkShippingFee: async (req, res) => {
    try {
      const { addressId } = req.body;
      const user = req.user;
      const Cart = await CartModel.findOne({ user: user._id });
      const storeCarts = await CartStoreModel.aggregate([
        {
          $match: { cart_id: Cart._id },
        },
        {
          $lookup: {
            from: "stores",
            localField: "store_id",
            foreignField: "_id",
            as: "store",
          },
        },
        { $unwind: "$store" },
        {
          $lookup: {
            from: "cartitems",
            localField: "_id",
            foreignField: "cartStore_id",
            as: "items",
          },
        },
        {
          $addFields: {
            items: {
              $filter: {
                input: "$items",
                as: "item",
                cond: { $eq: ["$$item.is_chosen", true] },
              },
            },
          },
        },
        {
          $match: { "items.0": { $exists: true } },
        },
      ]);
      console.log(storeCarts);
      const address = await AddressModel.findById(addressId);
      if (!address)
        return res.status(400).send({ message: "Please choose your adrress!" });
      console.log(address);
      await Promise.all(
        storeCarts.map(async (store) => {
          console.log(store);
          const storeDoc = await CartStoreModel.findById(store._id);
          if (!storeDoc) return;
          console.log({
            addressLat: address.lat,
            addressLng: address.lng,
            storeLat: store.store.lat,
            storeLng: store.store.lng,
          });

          const distance = haversineDistance(
            address.lat,
            address.lng,
            store.store.lat,
            store.store.lng
          );

          let fee;
          if (distance < 5) fee = 0;
          else if (distance < 20) fee = Math.round(distance * 3000);
          else if (distance < 100) fee = Math.round(distance * 2000);
          else fee = 100000;
          console.log(fee);

          storeDoc.shippingFee = fee;
          await storeDoc.save();
          store.shippingFee = storeDoc.shippingFee;
        })
      );

      res.status(200).send({ message: "Success", data: storeCarts });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
  numberOfItem: async (req, res) => {
    try {
      const user = req.user;
      let itemCount = 0;
      const cart = await CartModel.findOne({ user: user._id });
      const cartStore = await CartStoreModel.find({ cart_id: cart._id });
      await Promise.all(
        cartStore.map(async (s) => {
          const num = await CartItemModel.countDocuments({
            cartStore_id: s._id,
          });
          itemCount += num;
        })
      );
      res.status(200).send({ data: itemCount });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
};

export default CartController;
