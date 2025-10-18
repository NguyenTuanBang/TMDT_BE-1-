// const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
// const validator = require("validator");
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const tempUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Tên đăng nhập không được trống"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email không được trống"],
      lowercase: true,
      validate: [validator.isEmail, "Sai định dạng Email"],
    },

    password: {
      type: String,
      required: [true, "Mật khẩu không được trống"],
      minlength: [8, "Mật khẩu phải có ít nhất 8 ký tự"],
      match: [
        /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/,
        "Mật khẩu phải chứa ít nhất 1 chữ số và 1 ký tự đặc biệt",
      ],
      select: false,
    },

    passwordConfirm: {
      type: String,
      required: [true, "Vui lòng xác nhận lại mật khẩu"],
      select: false,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Mật khẩu xác nhận không khớp",
      },
    },

    otp: {
      type: String,
      required: true,
    },
    otpExpires: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// tempUserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   this.passwordConfirm = undefined;
//   next();
// });

const TempUser = mongoose.model("TempUser", tempUserSchema);
export default TempUser;
