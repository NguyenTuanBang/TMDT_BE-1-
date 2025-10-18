import { Router } from "express";
import productController from "../controllers/product.Controller.js";
const router = Router();

router.post('/', productController.getAll);


router.get('/most-favourite', productController.getMostFavourite);

router.get('/top-rating', productController.getTopRating);
router.get('/search', productController.searchByName);
router.get('/:id', productController.getOneProduct);


export default router;