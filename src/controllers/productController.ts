import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { Product } from '../types/product';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export const getProducts = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(data as Product);
};

export const addProduct = [
  upload.array('files'), 
  async (req: any, res: Response) => {
    try {
      const { name, price, description, mainImage: mainFromClient } = req.body;
      if (!name || !price) return res.status(400).json({ error: 'Nom et prix requis' });

      const urls: string[] = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
            const { error } = await supabase.storage
              .from('product-images')
              .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });
            if (error) {
              console.error(`Erreur upload pour ${file.originalname}:`, error.message);
              continue;
            }
            const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName);
            urls.push(publicUrl.publicUrl);
          } catch (e) {
            console.error(`Exception upload ${file.originalname}:`, e);
          }
        }
      }

      if (req.body.images) {
        const existing: string[] = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        urls.push(...existing.filter((u) => u && !urls.includes(u)));
      }

      const mainImage = mainFromClient || urls[0] || '';

      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert([{ name, price, description, mainImage, images: urls }]);

      if (insertError) return res.status(500).json({ error: insertError.message });
      res.json(insertData);
    } catch (e) {
      console.error('Erreur création produit :', e);
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
        const { error } = await supabase.storage.from('product-images').remove([decodedUrl]);
        if (error) console.error('Erreur suppression image:', error.message);
      }
    }

    const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
    if (deleteError) return res.status(500).json({ error: deleteError.message });

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
};

export const updateProduct = [
  upload.array('files'),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { name, price, description, mainImage: mainFromClient } = req.body;
      
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError) return res.status(500).json({ error: fetchError.message });
      if (!existingProduct) return res.status(404).json({ error: 'Produit introuvable' });

      const urls: string[] = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
          const { error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });
          if (!error) {
            const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName);
            urls.push(publicUrl.publicUrl);
          }
        }
      }

      if (req.body.images) {
        const existing: string[] = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        urls.push(...existing.filter((u) => u && !urls.includes(u)));
      }

      const mainImage = mainFromClient || urls[0] || '';

      const { data, error: updateError } = await supabase
        .from('products')
        .update({ name, price, description, mainImage, images: urls })
        .eq('id', id);

      if (updateError) return res.status(500).json({ error: updateError.message });
      res.json(data);
    } catch (e) {
      console.error('Erreur modification produit :', e);
      res.status(500).json({ error: 'Erreur modification produit' });
    }
  },
];
