import { Router } from 'express';
import { getProducts, addProduct, getProductById, deleteProduct, updateProduct } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', addProduct);
router.delete('/:id',deleteProduct)
router.put('/:id', updateProduct);

export default router;
