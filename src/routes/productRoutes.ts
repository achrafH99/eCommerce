import { Router } from 'express';
import { getProducts, addProduct, getProductById, deleteProduct } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', addProduct);
router.delete('/:id',deleteProduct)
export default router;
