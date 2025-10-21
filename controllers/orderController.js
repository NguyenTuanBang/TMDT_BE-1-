import CartItemModel from "../models/CartItemModel.js";
import CartModel from "../models/CartModel.js";
import CartStoreModel from "../models/CartStoreModel.js";
import OrderItemModel from "../models/OrderItemModel.js";
import OrderModel from "../models/OrderModel.js";
import OrderStoreModel from "../models/OrderStoreModel.js";
import AuditLogModel from "../models/AuditLogModel.js";
import ProductVariantsModel from "../models/product_variantsModel.js";

const OrderController = {
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
      // console.log(storeItems);
      await Promise.all(
        validStores.map(async ({store, items}) => {         
          const storeOrder = await OrderStoreModel.create({
            order_id: order._id,
            store: store.store_id,
            promotion: store.promotion,
            shippingFee: store.shippingFee,
            subTotal: store.subTotal,
            finalTotal: store.finalTotal,
          });
          await Promise.all(
            items.map(async (item) => {
              await OrderItemModel.create({
                storeOrder: storeOrder._id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                finalPrice: item.finalPrice,
              });
              const cartItem = await CartItemModel.findById(item._id)
              const variant = await ProductVariantsModel.findById(item.variant_id)
              variant.stock_quantity = Math.max(0, variant.stock_quantity - item.quantity)
              await variant.save();
              await cartItem.deleteOne()
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
          {
            field: "status",
            oldValue: "Pending",
            newValue: "Cancelled",
          },
        ],
        performedBy: user._id,
      });
      res.status(200).send({ message: "Success" });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
};

export default OrderController;
