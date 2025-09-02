import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { Product } from '../types/product';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadImage = [
  upload.single('file'),
  async (req: any, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

      const file = req.file;
      const fileName = `${Date.now()}-${file.originalname}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) return res.status(500).json({ error: error.message });

      const { data: publicUrl } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      res.json({ url: publicUrl.publicUrl });
    } catch (e) {
      res.status(500).json({ error: 'Erreur upload image' });
    }
  },
];

export const getProducts = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single(); 

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Produit introuvable' });

  res.json(data as Product);
};
export const addProduct = async (req: Request, res: Response) => {
  const { name, price, mainImage, images, description }: Product = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([{ name, price, mainImage, images, description }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
