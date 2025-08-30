import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const createOrder = async (req: Request, res: Response) => {
  const { customer_name, customer_email, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }

  try {
    const orderId = uuidv4();
    const { error: orderError } = await supabase.from('orders').insert([
      {
        id: orderId,
        customer_name,
        customer_email,
      },
    ]);

    if (orderError) throw orderError;

    const orderItems = items.map((item: any) => ({
      id: uuidv4(),
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.status(201).json({ message: 'Commande créée', orderId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          quantity,
          product_id,
          products (id, name, price, mainImage)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
