import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
    nameTag: { type: String, required: true },
    url: { type: String, required: true },
});

const TagModel = mongoose.model("Tag", tagSchema);
export default TagModel;
