import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
    content: { type: String, required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    about: {
        type: String,
        enum: ['store', 'product', 'user', 'order'],
        required: true
    }
}, { timestamps: true });

const ReplyModel = mongoose.model('Reply', ReplySchema);

export default ReplyModel;