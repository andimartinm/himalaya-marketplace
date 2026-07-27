import { UserRole, UserStatus, OrderStatus, DeliveryMethod } from '@prisma/client';

export type { UserRole, UserStatus, OrderStatus, DeliveryMethod };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  barrioId: string | null;
  emprendedorId: string | null;
}

export interface CartItem {
  productoId: string;
  name: string;
  price: number;
  quantity: number;
  emprendedorId: string;
  emprendedorName: string;
}

export interface CartState {
  items: CartItem[];
  emprendedorId: string | null;
}
