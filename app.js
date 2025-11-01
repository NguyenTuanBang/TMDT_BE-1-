import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
// const storeRouter = require("./routes/StoreRoutes");
import StoreRoutes from "./routes/StoreRoutes.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/product.Route.js"; 
import reviewRouter from "./routes/reviewRoutes.js"; 
import replyRouter from "./routes/replyRoute.js"; 
import adminRouter from "./routes/admin.Route.js"; 
import variantRouter from "./routes/variantRoute.js"; 
import promotionRouter from "./routes/promotionRouter.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import tagsController from './controllers/tags.Controller.js'
import globalErrorHandle from "./controllers/errorController.js";
import AppError from "./utils/appError.js";
import authController from "./controllers/authController.js";
import test from "./test.js";
import productController from "./controllers/product.Controller.js";
import upload from "./middlewares/uploadAvatar.js";

const app = express();

// Lấy __dirname trong môi trường ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


app.use(
  cors({
    origin: [
      "https://tmdt-fe-1.vercel.app",
      "http://localhost:5173"
    ],
    credentials: true,
  })
);


// Middleware đọc JSON & cookie
app.use(express.json());
app.use(cookieParser());



// Routes
app.use("/api/reply", replyRouter);
app.use("/api/users", userRouter);
app.use('/api/cart', cartRouter);
app.use('/products', productRouter);
app.use('/api/products', adminRouter);
app.use('/api/variant', variantRouter);
app.use('/api/orders', orderRouter);
app.use('/api/createProduct', authController.protect, upload.array("variantImages"), productController.createNewProduct);
app.use("/api/promotion", promotionRouter)
app.get('/alltags', tagsController.getAll);
app.get('/sixtags', tagsController.getSix);
app.get('/testdata', authController.protect, test.getOrder)
app.use("/api/stores", StoreRoutes);
app.use("/api/reviews", reviewRouter);
app.get('/api/geocode', async (req, res) => {
  try {
    const address = (req.query.address || '').trim();
    if (!address) return res.status(400).json({ message: 'address is required' });
    if (!process.env.DISTANCEMATRIX_API_KEY) {
      return res.status(500).json({ message: 'Missing DISTANCEMATRIX_API_KEY in .env' });
    }
    const url = `https://api.distancematrix.ai/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.DISTANCEMATRIX_API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    // Sửa đoạn này: lấy data.result thay vì data.results
    const results = data.results || data.result; // fallback cho cả 2 trường hợp
    if (data.status !== 'OK' || !results?.length) {
      return res.status(404).json({ message: 'Coordinates not found', raw: data });
    }
    const loc = results[0].geometry.location;
    console.log('Geocoding result:', loc.lat, loc.lng);
    return res.json({ lat: loc.lat, lng: loc.lng });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Geocoding error' });
  }
});
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
