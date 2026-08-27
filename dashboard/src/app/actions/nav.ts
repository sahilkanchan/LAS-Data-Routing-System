'use server'; // explicitly execute on server.

import { query } from "../lib/db";

import { BatchInterface } from "../models/Batch";

export async function getBatchSnippets() {
  try {
    const limit = 10
    const batches = await query<BatchInterface>(
      `SELECT numFiles, benchmark, batchWordErrorRate, totalTime, uuid, created_at FROM Batch ORDER BY created_at DESC LIMIT ${limit}`,
      false
    )
    return batches;
  } catch {
    return [];
    // return { msg: "Couldn't fetch batches." };
  }
}