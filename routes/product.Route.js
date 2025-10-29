import { Router } from "express";
import productController from "../controllers/product.Controller.js";
import upload from "../middlewares/uploadAvatar.js";
const router = Router();

router.post('/', productController.getAll);


router.get('/most-favourite', productController.getMostFavourite);

router.get('/top-rating', productController.getTopRating);
router.get('/search', productController.searchByName);
router.get('/:id', productController.getOneProduct);
// router.get('/category/:categoryId', productController.getProductsByCategory);


export default router;