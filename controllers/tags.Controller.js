import TagModel from "../models/TagModel.js";

const tagsController = {
    getAll: async (req, res) => {
        try {
            const tags = await TagModel.find();
            res.status(200).send({ message: "Success", data: tags });
        } catch (error) {
            res.status(500).send({ message: "Error", error: error.message });
        }
    },
    getSix: async (req, res) => {
        try {
            const countTags = await TagModel.countDocuments();
            const tags = await TagModel.find().limit(6);
            res.status(200).send({ message: "Success", data: tags, open: countTags > 6 });
        } catch (error) {
            res.status(500).send({ message: "Error", error: error.message });
        }
    },
};

export default tagsController;
