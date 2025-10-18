// const AppError = require("../utils/appError");

// //Lỗi id không hợp lệ
// const handleCastErrorDB = (err) => {
//   const message = `${err.path} Không hợp lệ: ${err.value}`;
//   return new AppError(message, 400);
// };

// //Lỗi trùng trường
// const handleDuplicateFieldDB = (err) => {
//   const field = Object.keys(err.keyValue)[0];
//   const message = `'${field}' đã tồn tại`;
//   return new AppError(message, 400);
// };

// //Loi token ko hop le
// const handleJWTError = () => {
//   return new AppError("Invalid token. Please log in again!", 401);
// };

// //Loi token expired
// const handleJWTExpiredError = () => {
//   return new AppError("Your token has expired! Please log in again", 401);
// };

// const handleValidationErrorDB = (err) => {
//   const errors = Object.values(err.errors).map((el) => el.message);
//   const message = `${errors.join(". ")}`;
//   return new AppError(message, 400);
// };

// const sendErrorDev = (err, res) => {
//   res.status(err.statusCode).json({
//     status: err.status,
//     error: err,
//     message: err.message,
//     stack: err.stack,
//   });
// };

// const sendErrorProd = (err, res) => {
//   if (err.isOperational) {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//     });
//   } else {
//     console.error("ERROR", err);
//     res.status(500).json({
//       status: "error",
//       message: "Đã có lỗi xảy ra, vui lòng thử lại sau.",
//     });
//   }
// };

// module.exports = (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || "error";

//   if (process.env.NODE_ENV === "development") {
//     sendErrorDev(err, res);
//   } else if (process.env.NODE_ENV === "production") {
//     let error = Object.create(err);
//     if (error.name === "CastError") error = handleCastErrorDB(error);
//     if (error.code === 11000) error = handleDuplicateFieldDB(error);
//     if (error.name === "ValidationError")
//       error = handleValidationErrorDB(error);
//     if (error.name === "JsonWebTokenError") error = handleJWTError(error);
//     if (error.name === "TokenExpiredError")
//       error = handleJWTExpiredError(error);
//     sendErrorProd(error, res);
//   }
// };

import AppError from "../utils/appError.js";

// Lỗi id không hợp lệ
const handleCastErrorDB = (err) => {
  const message = `${err.path} không hợp lệ: ${err.value}`;
  return new AppError(message, 400);
};

// Lỗi trùng trường
const handleDuplicateFieldDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `'${field}' đã tồn tại`;
  return new AppError(message, 400);
};

// Lỗi token không hợp lệ
const handleJWTError = () => {
  return new AppError("Token không hợp lệ. Vui lòng đăng nhập lại!", 401);
};

// Lỗi token hết hạn
const handleJWTExpiredError = () => {
  return new AppError("Token đã hết hạn! Vui lòng đăng nhập lại.", 401);
};

// Lỗi validate
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Đã có lỗi xảy ra, vui lòng thử lại sau.",
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message };

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error.name === "TokenExpiredError")
      error = handleJWTExpiredError(error);

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
