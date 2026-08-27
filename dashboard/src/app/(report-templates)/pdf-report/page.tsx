import type { Metadata } from "next";

import { randomUUID } from "crypto";

import PDFReportClient from "./PDFReportClient";

import { getPDFReportContent } from "@/app/actions/template";

import { ServerParams } from "@/app/types/main";
import { getSafeUuids, getSafeColNames, getSafeFilterSortOptions } from "@/app/lib/common";

export const metadata: Metadata = {
  title: "PDF Report",
  description: "PDF Report page for the LAS Dashboard.",
};

function generateHash(): string {
  const timestamp = Date.now().toString(36);
  const uuid = randomUUID().split('-')[0]; // take just part to keep it short
  return `${timestamp}-${uuid}`;
}

interface PDFReportProps extends ServerParams {
  searchParams?: Promise<{ b: string, c?: string, f?: string, s?: string }>;
}

export default async function PDFReport({ searchParams }: PDFReportProps) {
  // Init load extract params state (safely).
  const query = await searchParams;
  const batchUuids = query?.b ? getSafeUuids(query?.b) : null;
  const colNames = query?.c ? getSafeColNames(query?.c) : null;
  const filterBy = query?.f ? getSafeFilterSortOptions(query?.f) : null;
  const orderBy = query?.s ? getSafeFilterSortOptions(query?.s) : null;

  // Server action call to get PDF report content.
  const pdfReportContent = await getPDFReportContent(batchUuids, { filterBy, orderBy });
  const pdfReportHash = generateHash();

  return <PDFReportClient
    content={pdfReportContent}
    hash={pdfReportHash}
    tableOptions={{ filterBy, orderBy, colNames }}
  />
}