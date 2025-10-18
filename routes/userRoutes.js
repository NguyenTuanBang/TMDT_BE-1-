import express from "express";
import authController from "../controllers/authController.js";
import userController from "../controllers/userController.js";
import uploadAvatar from "../middlewares/uploadAvatar.js";

const router = express.Router();

router.get("/", authController.getAllUsers);

router.post("/logout", authController.logout);
router.post("/signup", authController.signup);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);

router.post("/login", authController.login);

router.post("/forgot-password", authController.forgotPassword);
router.post(
  "/resend-otp-forgot-password",
  authController.resendOtpForgotPassword
);
router.post("/verify-forgot-password", authController.verifyForgotPassword);

router.post(
  "/reset-password",
  authController.verifyResetTokenCookie,
  authController.resetPassword
);

router
  .route("/me")
  .get(authController.protect, userController.getMe)
  .patch(
    authController.protect,
    uploadAvatar.single("avatar"),
    userController.updateMe
  );

router
  .route("/me/address")
  .get(authController.protect, userController.getAddresses)
  .post(authController.protect, userController.addAddress);

router.patch(
  "/me/address/:id/default",
  authController.protect,
  userController.setAddressDefault
);

router
  .route("/me/address/:id")
  .patch(authController.protect, userController.updateAddress)
  .delete(authController.protect, userController.deleteAddress);

router
  .route("/me/confirm-change-password")
  .post(authController.protect, authController.confirmChangePassword);

router
  .route("/me/change-password")
  .post(authController.protect, authController.changePassword);

export default router;
