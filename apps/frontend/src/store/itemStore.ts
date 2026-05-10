import { create } from 'zustand';
import api from '../api/client';

export interface Item {
  id: string;
  uniqueCode: string;
  type: string;
  nameCn: string;
  nameEn: string;
  nameAr: string | null;
  weightGross: number | null;
  weightNet: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  parentId: string | null;
  partDescription: string | null;
  isContainer: boolean;
  createdAt: string;
  parts?: Item[];
  containerItems?: ContainerItemRel[];
  containedIn?: ContainerItemRel[];
  parent?: Item;
}

export interface ContainerItemRel {
  id: string;
  containerId: string;
  itemId: string;
  quantity: number;
  item?: Item;
  container?: { id: string; uniqueCode: string };
}

interface ItemState {
  items: Item[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  currentItem: Item | null;
  fetchItems: (params?: Record<string, string>) => Promise<void>;
  fetchItem: (id: string) => Promise<void>;
  fetchItemByCode: (code: string) => Promise<Item>;
  createItem: (data: Record<string, unknown>) => Promise<Item>;
  updateItem: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useItemStore = create<ItemState>((set) => ({
  items: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  currentItem: null,

  fetchItems: async (params) => {
    set({ loading: true });
    try {
      const res = await api.get('/items', { params });
      set({
        items: res.data.items,
        total: res.data.total,
        page: res.data.page,
        totalPages: res.data.totalPages,
        loading: false,
      });
    } catch {
      set({ loading: false, items: [], total: 0 });
    }
  },

  fetchItem: async (id) => {
    try {
      const res = await api.get(`/items/${id}`);
      set({ currentItem: res.data });
    } catch {
      // item not found or network error
    }
  },

  fetchItemByCode: async (code) => {
    const res = await api.get(`/items/code/${code}`);
    return res.data;
  },

  createItem: async (data) => {
    const res = await api.post('/items', data);
    return res.data;
  },

  updateItem: async (id, data) => {
    await api.put(`/items/${id}`, data);
  },

  deleteItem: async (id) => {
    await api.delete(`/items/${id}`);
  },
}));
