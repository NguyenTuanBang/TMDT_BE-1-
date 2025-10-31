import ReplyModel from "../models/ReplyModel.js"

const ReplyController = {
    getReply: async (req, res)=>{
        try {
            const user= req.user
            const reply = await ReplyModel.find({ to: user._id })
            res.status(200).send({ message: "Success", data: reply })
        } catch (error) {
            res.status(500).send({ message: error.message })
        }
    }
}

export default ReplyController