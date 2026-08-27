'use client'; // explicit since store should be in client.

import { create } from 'zustand'

import { BatchInterface } from '@/app/models/Batch';

type BatchState = {
  batches: BatchInterface[],
  selectedBatch: BatchInterface[]
}

type BatchAction = {
  setBatches: (batches: BatchInterface[]) => void,
  setSelectedBatch: (batch: BatchInterface[]) => void,
  getSelectedBatchCommaSeparated: () => string,
}

export const useBatchStore = create<BatchState & BatchAction>()((set, get) => ({
  batches: [],
  selectedBatch: [],
  setBatches: (batches) => set({ batches: batches }),
  setSelectedBatch: (selectedBatch) => set({ selectedBatch: selectedBatch }),
  getSelectedBatchCommaSeparated: () => get().selectedBatch.map((batch) => batch.uuid).join(',')
}))