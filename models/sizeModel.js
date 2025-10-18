import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
    size_value: {
        type: String, 
        required: true
    },
});

const SizeModel = mongoose.model("Size", sizeSchema);
export default SizeModel;
