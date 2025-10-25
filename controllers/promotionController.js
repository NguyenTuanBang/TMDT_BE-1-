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
            const {storeId} = req.params
            const date = new Date()
            const data = await PromotionModel.find({
                store: storeId,
                scope: "store",
                start_date: { $lte: date },
                end_date: { $gte: date },
                quantity: { $gt: 0 }
            })
            res.status(200).send({
                message: "Success",
                data
            })
        } catch (error) {
            res.status(500).send({
                message: error.message
            })
        }
    },
    createPromotion: async (req, res) => {
        try {
            const user = req.user
            const {
                name,
                description,
                discount_type,
                discount_value,
                max_discount_value,
                quantity,
                start_date,
                end_date,
                scope
            } = req.body
            let store;
            if (scope === "store") {
                store = await StoreModel.findOne({user: user._id})
                if (!store) {
                    return res.status(400).send({
                        message: "Store not found for this user"
                    })
                }
            }
            const promotion = await PromotionModel.create({
                name,
                description,
                discount_type,
                discount_value,
                max_discount_value,
                quantity,
                start_date,
                end_date,
                scope,
                store: scope === "store" ? store._id : undefined
            })

            res.status(201).send({
                message: "Promotion created successfully",
                promotion
            })
        } catch (error) {
            res.status(500).send({
                message: error.message
            })
        }
    }
}

export default PromotionController