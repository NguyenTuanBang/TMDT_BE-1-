import CartModel from "../models/CartModel.js"
import CartStoreModel from "../models/CartStoreModel.js"
import PromotionModel from "../models/PromotionModel.js"
import StoreModel from "../models/StoreModel.js"

const PromotionController = {
    getGlobalPromotion: async (req, res) => {
        const date = Date.now()
        const promotion = await PromotionModel.find({
            scope: "global",
            start_date: { $lte: now },
            end_date: { $gte: now },
            quantity: { $gt: 0 }
        })
        res.status(200).send({
            message: "Success",
            promotion
        })
    },
    getStorePromotion: async (req, res) => {
        try {
            const user = req.user
            const date = Date.now()
            const cart = await CartModel.findOne({ user: user._id })
            const cart_store = await CartStoreModel.find({ cart_id: cart._id })
            const store = cart_store.map(item => item.store_id)
            const data = await StoreModel.aggregate([
                {
                    $match: {
                        _id: { $in: store },
                    }
                },
                {
                    $lookup: {
                        from: "promotions",
                        let: { cid: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$store", "$$cid"] }, 
                                    start_date: { $lte: now },
                                    end_date: { $gte: now },
                                    quantity: { $gt: 0 }
                                }
                            }],
                        as: "promotion"
                    }
                },
                {}
            ])
            res.status(200).send({
                message: "Success",
                data
            })
        } catch (error) {
            res.status(500).send({
                message: error.message
            })
        }
    }
}

export default PromotionController