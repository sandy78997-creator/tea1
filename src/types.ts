export interface MenuItem {
  id?: string;
  name: string;
  category: string;
  priceTeaMilk: number;
  priceMilkTea: number;
  badges: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  variant: '茶乳' | '乳茶';
  price: number;
  quantity: number;
  ice: string;
  sugar: string;
}

export interface Order {
  id?: string;
  userId: string;
  customerName: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  totalPrice: number;
  items: OrderItem[];
  createdAt?: any;
  updatedAt?: any;
}
