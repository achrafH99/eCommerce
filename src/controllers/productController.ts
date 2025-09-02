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
      const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true, 
        });
      

      if (uploadError) return res.status(500).json({ error: uploadError.message });

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
export const addProduct = [
  upload.array('files'), 
  async (req: any, res: Response) => {
    try {
      const { name, price, description } = req.body;

      if (!name || !price) return res.status(400).json({ error: 'Nom et prix requis' });

      const urls: string[] = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileName = `${Date.now()}-${file.originalname}`;
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

          if (error) return res.status(500).json({ error: error.message });

          const { data: publicUrl } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          urls.push(publicUrl.publicUrl);
        }
      }

      const mainImage = urls[0] || ''; 

      const { data, error } = await supabase
        .from('products')
        .insert([{ name, price, description, mainImage, images: urls }]);

      if (error) return res.status(500).json({ error: error.message });

      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Erreur création produit' });
    }
  },
];

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!product) return res.status(404).json({ error: 'Produit introuvable' });

    if (product.images && product.images.length > 0) {
      for (const url of product.images) {
        const decodedUrl = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
        const { error } = await supabase.storage
          .from('product-images')
          .remove([decodedUrl]);
        if (error) console.error('Erreur suppression image:', error.message);
      }
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
};

