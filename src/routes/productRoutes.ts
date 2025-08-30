import { Router } from 'express';
import { getProducts, addProduct, getProductById } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', addProduct);

export default router;
