export type User = {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  created_at?: Date;
};
