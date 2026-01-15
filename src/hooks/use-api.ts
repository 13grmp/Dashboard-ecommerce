import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

// Tipos para API
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  isActive: boolean;
  categoryId: string;
  brandId: string;
  category?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  images: {
    id: string;
    url: string;
    isMain: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}



export interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  shippingCost: number;
  discount: number;
  items: OrderItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface TotalUser {
  total: number;
  new: number;
}

export interface TopProduct {
  id: number;
  image: string;
  name: string;
  price: string
  quantitySold: number;
  sku: string;
  category: string;
}

export interface OrdersWithUser {
  id: string,
  orderNumber: string,
  status: string,
  shippingCoast: string,
  discount: string,
  total:string;
  updateAt: string,
  createdAt: string,
  nomeUsuario: string,
}

export interface Stats {
  recentOrders: Order[];
  topProducts: Product[];
  users: {
    total: String,
    new: String,
  };
  products: {
    total: String,
    active: String,
    lowStock: String,
  };
  orders: OrdersWithUser[],
  sales: {
    total: string,
    completedOrders: string,
    averageOrderValue: string,
    topProducts: TopProduct[],
    byDay: string,
  },
  period: String,
  startDate: String,
  endDate: String,
}

// Hook genérico para fazer requisições à API
export function useApi() {
  const { accessToken, refreshToken } = useAuth();

  const makeRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      console.log(endpoint);
      console.log(options);
      let token = accessToken;
      console.log(token);
      // Garantir headers como objeto simples
      const headersObj: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Se options.headers for Headers ou algo do tipo, converte para Record<string, string>
      if (options.headers instanceof Headers) {
        Object.entries(Object.fromEntries(options.headers.entries())).forEach(
          ([key, value]) => {
            headersObj[key] = value;
          }
        );
      } else if (options.headers && typeof options.headers === 'object') {
        Object.entries(options.headers as Record<string, string>).forEach(
          ([key, value]) => {
            headersObj[key] = value;
          }
        );
      }

      // Adiciona token ao header
      if (token) {
        headersObj['Authorization'] = `Bearer ${token}`;
      }

      let response = await fetch(endpoint, {
        ...options,
        headers: headersObj, // <- agora garantidamente correto
      });

      // Token expirado, tentar renovar
      if (response.status === 401 && token) {
        const newToken = await refreshToken();
        if (newToken) {
          headersObj['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(endpoint, {
            ...options,
            headers: headersObj,
          });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.error || `Erro ${response.status}`,
          isLoading: false,
        };
      }

      return {
        data,
        error: null,
        isLoading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false,
      };
    }
  };

  return { makeRequest };
}


// Hook para buscar produtos
export function useProducts(filters?: {
  search?: string;
  category?: string;
  brand?: string;
  page?: number;
  limit?: number;
}) {
  const [state, setState] = useState<ApiResponse<{ products: Product[]; total: number }>>({
    data: null,
    error: null,
    isLoading: true,
  });

  const { makeRequest } = useApi();

  useEffect(() => {
    const fetchProducts = async () => {
      setState(prev => ({ ...prev, isLoading: true }));

      // Construir query string
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.brand) params.append('brand', filters.brand);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;

      const result = await makeRequest<{ products: Product[]; total: number }>(endpoint);
      setState(result);
      console.log(result);
    };

    fetchProducts();
  }, [filters?.search, filters?.category, filters?.brand, filters?.page, filters?.limit]);

  return state;
}

// Hook para buscar estatísticas (admin)
export function useStats() {
  const [state, setState] = useState<ApiResponse<Stats>>({
    data: null,
    error: null,
    isLoading: true,
  });

  const { makeRequest } = useApi();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Não fazer a requisição se ainda estiver carregando a autenticação
    if (authLoading) {
      return;
    }

    // Não fazer a requisição se não estiver autenticado
    if (!isAuthenticated) {
      setState({
        data: null,
        error: null,
        isLoading: false
      });
      return;
    }

    const fetchStats = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      const result = await makeRequest<Stats>('/api/admin/stats');
      setState(result);
    };

    fetchStats();
  }, [authLoading, isAuthenticated]);

  const refetch = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await makeRequest<Stats>('/api/admin/stats');
    setState(result);
  };

  return { ...state, refetch };
}

// Hook para buscar pedidos
export function useOrders(filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const [state, setState] = useState<ApiResponse<{ orders: Order[]; total: number }>>({
    data: null,
    error: null,
    isLoading: true,
  });

  const { makeRequest } = useApi();

  useEffect(() => {
    const fetchOrders = async () => {
      setState(prev => ({ ...prev, isLoading: true }));

      // Construir query string
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/api/orders${queryString ? `?${queryString}` : ''}`;

      const result = await makeRequest<{ orders: Order[]; total: number }>(endpoint);
      setState(result);
    };

    fetchOrders();
  }, [filters?.status, filters?.page, filters?.limit]);

  return state;
}

// Hook para buscar relatório de vendas
export function useSalesReport(filters?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}) {
  const [state, setState] = useState<ApiResponse<any>>({
    data: null,
    error: null,
    isLoading: true,
  });

  const { makeRequest } = useApi();

  useEffect(() => {
    const fetchSalesReport = async () => {
      setState(prev => ({ ...prev, isLoading: true }));

      // Construir query string
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.groupBy) params.append('groupBy', filters.groupBy);

      const queryString = params.toString();
      const endpoint = `/api/admin/reports/sales${queryString ? `?${queryString}` : ''}`;

      const result = await makeRequest<any>(endpoint);
      setState(result);
    };

    fetchSalesReport();
  }, [filters?.startDate, filters?.endDate, filters?.groupBy]);

  return state;
}

// Hook para buscar usuários (admin)
export function useUsers(filters?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const [state, setState] = useState<ApiResponse<{ users: any[]; total: number }>>({
    data: null,
    error: null,
    isLoading: true,
  });

  const { makeRequest } = useApi();

  useEffect(() => {
    const fetchUsers = async () => {
      setState(prev => ({ ...prev, isLoading: true }));

      // Construir query string
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ''}`;

      const result = await makeRequest<{ users: any[]; total: number }>(endpoint);
      setState(result);
    };

    fetchUsers();
  }, [filters?.search, filters?.role, filters?.page, filters?.limit]);

  return state;
}

