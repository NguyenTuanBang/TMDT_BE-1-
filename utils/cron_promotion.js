import cron from "node-cron";
import CartModel from "../models/CartModel.js";
import CartStoreModel from "../models/CartStoreModel.js";
import { applyPromotionsToItems } from "../utils/calculateCart.js";

cron.schedule("* * * * *", async () => { // chạy mỗi phút
  console.log("🕒 Running promotion expiration check...");
  const now = new Date();

  try {
    // 1️⃣ Tìm cart và cartStore có khuyến mãi đã hết hạn
    const [expiredCarts, expiredStores] = await Promise.all([
      CartModel.find({
        promotion: { $ne: null },
        promotionExpiresAt: { $lt: now }
      }).select("_id"),
      CartStoreModel.find({
        promotion: { $ne: null },
        promotionExpiresAt: { $lt: now }
      }).select("_id cart_id")
    ]);

    // 2️⃣ Xóa promotion đã hết hạn (song song)
    const updateOps = [
      ...expiredCarts.map(c =>
        CartModel.updateOne(
          { _id: c._id },
          { $set: { promotion: null, promotionExpiresAt: null } }
        )
      ),
      ...expiredStores.map(s =>
        CartStoreModel.updateOne(
          { _id: s._id },
          { $set: { promotion: null, promotionExpiresAt: null } }
        )
      )
    ];
    await Promise.all(updateOps);

    // 3️⃣ Gom các cart bị ảnh hưởng
    const affectedCartIds = new Set([
      ...expiredCarts.map(c => c._id.toString()),
      ...expiredStores.map(s => s.cart_id.toString())
    ]);

    // 4️⃣ Chỉ tính lại mỗi cart 1 lần
    for (const cartId of affectedCartIds) {
      await applyPromotionsToItems(cartId);
    }

    console.log(
      `✅ Promotion expiration check done: ${affectedCartIds.size} cart(s) updated.`
    );
  } catch (err) {
    console.error("❌ Error in promotion cron:", err);
  }
});
