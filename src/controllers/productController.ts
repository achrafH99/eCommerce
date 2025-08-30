import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { Product } from '../types/product';

export const getProducts = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const addProduct = async (req: Request, res: Response) => {
  const { name, price, mainImage, images, description }: Product = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([{ name, price, mainImage, images, description }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
