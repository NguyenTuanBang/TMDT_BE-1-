// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../config/cloudinary");

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "citizens",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadCitizen = multer({ storage }).fields([
  { name: "citizenImageFront", maxCount: 1 },
  { name: "citizenImageBack", maxCount: 1 },
]);

export default uploadCitizen;
