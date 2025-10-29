import express from 'express';
import productController from '../controllers/product.Controller.js';
import authController from '../controllers/authController.js';
import upload from '../middlewares/uploadAvatar.js';
const router = express.Router();
router.get('/:id',authController.protect, authController.restrictTo('admin','seller'), productController.getVariantById);
router.put('/:id', authController.protect, authController.restrictTo('admin','seller'), upload.single('image'), productController.editVariant);

export default router;