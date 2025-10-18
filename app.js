import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/product.Route.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import tagsController from './controllers/tags.Controller.js'
import globalErrorHandle from "./controllers/errorController.js";
import AppError from "./utils/appError.js";
import authController from "./controllers/authController.js";
// import test from "./test.js";
import productController from "./controllers/product.Controller.js";
import upload from "./middlewares/uploadAvatar.js";

const app = express();

// Lấy __dirname trong môi trường ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Cấu hình CORS
const allowedOrigins = [
  "https://tmdt-fe-1.onrender.com",
  "http://localhost:5173"
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware đọc JSON & cookie
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/users", userRouter);
app.use('/api/cart', cartRouter);
app.use('/products', productRouter);
app.use('/api/order', orderRouter);
app.use('/api/createProduct', authController.protect, upload.array("variantImages"), productController.createNewProduct);
app.use("/promotion", productRouter)
app.get('/alltags', tagsController.getAll);
app.get('/sixtags', tagsController.getSix);
// app.get('/testdata', authController.protect, test.getOrderItem)
// ❌ KHÔNG cần serve thư mục local avatar nữa
// Vì dùng Cloudinary nên phần này bỏ đi:
// app.use("/img/avatars", express.static(path.join(__dirname, "public/img/avatars")));

// Middleware xử lý route không tồn tại
app.use((req, res, next) => {
  next(new AppError(`Không tìm thấy ${req.originalUrl} trên server này!`, 404));
});

// Middleware xử lý lỗi tổng
app.use(globalErrorHandle);

export default app;
