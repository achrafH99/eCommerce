import { Router } from 'express';
import { getProducts, addProduct, getProductById, uploadImage, deleteProduct } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', addProduct);
router.post('/upload', uploadImage);
router.delete('/:id',deleteProduct)
export default router;
