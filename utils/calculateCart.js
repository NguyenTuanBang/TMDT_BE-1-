import CartItemModel from "../models/CartItemModel.js";
import CartModel from "../models/CartModel.js";
import CartStoreModel from "../models/CartStoreModel.js";


export async function applyPromotionsToItems(cartId, storeId = null) {
    console.log("🔵 applyPromotionsToItems called - cartId:", cartId, "storeId:", storeId);
    
    const cart = await CartModel.findById(cartId).populate("promotion");
    const stores = storeId
        ? await CartStoreModel.find({ _id: storeId }).populate("promotion")
        : await CartStoreModel.find({ cart_id: cartId, onDeploy: true }).populate("promotion");

    console.log("🟢 Stores found:", stores.length);

    let cartTotal = 0;
    const storeTotals = {};

    for (const store of stores) {
        const items = await CartItemModel.find({ cartStore_id: store._id, is_chosen: true });
        console.log(`🟡 Store ${store._id} - Items found (is_chosen=true):`, items.length);
        
        const storeTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        console.log(`🟡 Store ${store._id} - storeTotal:`, storeTotal);
        
        storeTotals[store._id] = { items, storeTotal };
        cartTotal += storeTotal;
    }
    
    console.log("🟣 cartTotal:", cartTotal);

    // Tính global discount
    let globalDiscount = 0;
    if (cart.promotion) {
        const promo = cart.promotion;
        console.log(`🔴 CART has global promotion:`, promo.name, promo.discount_type, promo.discount_value);
        if (promo.discount_type === "fixed") globalDiscount = promo.discount_value;
        else if (promo.discount_type === "percentage") {
            globalDiscount = cartTotal * promo.discount_value / 100;
            if (promo.max_discount_value)
                globalDiscount = Math.min(globalDiscount, promo.max_discount_value);
        }
        console.log(`🔴 Global discount calculated:`, globalDiscount);
    } else {
        console.log(`⚪ No global cart promotion`);
    }

    // Áp khuyến mãi xuống từng item
    for (const store of stores) {
        const { items, storeTotal } = storeTotals[store._id];

        if (storeTotal === 0) {
            // Không có items được chọn hoặc storeTotal = 0
            console.log(`⚪ Store ${store._id} - No items selected or storeTotal = 0`);
            store.subTotal = 0;
            store.finalTotal = 0;
            await store.save({ validateBeforeSave: false });
            continue;
        }

        // Discount cấp store
        let storeDiscount = 0;
        if (store.promotion) {
            const promo = store.promotion;
            console.log(`🟠 Store promotion:`, promo.name, promo.discount_type, promo.discount_value);
            if (promo.discount_type === "fixed") storeDiscount = promo.discount_value;
            else if (promo.discount_type === "percentage") {
                storeDiscount = storeTotal * promo.discount_value / 100;
                if (promo.max_discount_value)
                    storeDiscount = Math.min(storeDiscount, promo.max_discount_value);
            }
            console.log(`🟠 Store discount calculated:`, storeDiscount);
        } else {
            console.log(`⚪ No store promotion`);
        }

        // Discount global phân bổ cho store này
        const globalForStore = (storeTotal / cartTotal) * globalDiscount;
        console.log(`🔵 Global discount for this store:`, globalForStore);

        // Phân bổ xuống từng item
        for (const item of items) {
            const itemTotal = item.unitPrice * item.quantity;
            const storePart = (itemTotal / storeTotal) * storeDiscount;
            const globalPart = (itemTotal / storeTotal) * globalForStore;

            console.log(`   📌 Item calc: itemTotal=${itemTotal}, storeTotal=${storeTotal}, ratio=${itemTotal/storeTotal}`);
            console.log(`   📌 storePart = ${storePart}, globalPart = ${globalPart}`);

            const totalDiscount = storePart + globalPart;
            const final = Math.max(itemTotal - totalDiscount, 0);
            
            console.log(`🔶 Item ${item._id}: unitPrice=${item.unitPrice}, qty=${item.quantity}, itemTotal=${itemTotal}, discount=${totalDiscount}, final=${final}`);

            await CartItemModel.findByIdAndUpdate(item._id, {
                finalPrice: final,
                discountValue: totalDiscount
            });
        }

        // Cập nhật lại subtotal của store
        const storeItems = await CartItemModel.find({ cartStore_id: store._id, is_chosen: true });
        const subTotal = storeItems.reduce((sum, i) => sum + i.finalPrice + i.discountValue , 0);
        const finalTotal = storeItems.reduce((sum, i) => sum + i.finalPrice , 0);
        console.log(`🟢 Store ${store._id} - Updated subTotal:`, subTotal);
        store.subTotal = subTotal;
        store.finalTotal = finalTotal;
        if(subTotal === 0){
            store.shippingFee = 0;
        }
        await store.save({ validateBeforeSave: false });
    }

    // Cập nhật lại tổng Cart
    const updatedStores = await CartStoreModel.find({ cart_id: cartId, onDeploy: true });
    const cartSub = updatedStores.reduce((sum, s) => sum + s.subTotal, 0);
    const shippingTotal = updatedStores.reduce((sum, s) => sum + (s.shippingFee || 0), 0);

    console.log(`💙 Cart total - subTotal: ${cartSub}, shipping: ${shippingTotal}, finalTotal: ${cartSub + shippingTotal}`);
    cart.shippingFee = shippingTotal
    cart.subTotal = cartSub;
    cart.finalTotal = cartSub + shippingTotal;
    await cart.save({ validateBeforeSave: false });
}