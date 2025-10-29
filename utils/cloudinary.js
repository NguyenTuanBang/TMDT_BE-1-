// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";


// console.log(process.cwd(), path.resolve(__dirname, "../config.env"), require("fs").existsSync(path.resolve(__dirname, "../config.env")))
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("✅ Cloudinary config loaded:", cloudinary.config());

export default cloudinary;
