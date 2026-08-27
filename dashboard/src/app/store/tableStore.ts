'use client'; // explicit since store should be in client.

import { create } from 'zustand'

type TableState = {
  sortByStore: string | null,
  filterByStore: string | null
  visibleColumnsStore: string[] | null
}

type TableAction = {
  setSortByStore: (sortByStore: string | null) => void,
  setFilterByStore: (filterByStore: string | null) => void
  setVisibleColumnsStore: (visibleColumnsStore: string[] | null) => void
  getVisibleColumnsCommaSeparated: () => string
}

export const useTableStore = create<TableState & TableAction>()((set, get) => ({
  sortByStore: null,
  filterByStore: null,
  visibleColumnsStore: null,
  setSortByStore: (sortByStore) => set({ sortByStore: sortByStore }),
  setFilterByStore: (filterByStore) => set({ filterByStore: filterByStore }),
  setVisibleColumnsStore: (visibleColumnsStore) => set({ visibleColumnsStore: visibleColumnsStore }),
  getVisibleColumnsCommaSeparated: () => get().visibleColumnsStore?.join(',') ?? ''
}))