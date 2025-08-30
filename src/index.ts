import express, { Request, Response } from 'express';
import { supabase } from './supabaseClient';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import cors from 'cors';
dotenv.config();

const app = express();

app.use(cors());
const port = 3010;

app.use(express.json());

app.use('/api/products', productRoutes);

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.listen(port, () => {
  console.log(`✅ Supabase backend running at http://localhost:${port}`);
});
