import type { Metadata } from "next";

import VisualizationPage from "@/app/components/visualizationPage/VisualizationPage";
import { ServerParams } from "@/app/types/main";

import { getVizAnalytics } from "@/app/actions/viz";
import { getSafeUuids } from "@/app/lib/common";

export const metadata: Metadata = {
  title: "Visualization",
  description: "Visualization page for the LAS Dashboard.",
};

interface VisualizationProps extends ServerParams {
  searchParams?: Promise<{ b: string }>;
}

export default async function Visualization({ searchParams }: VisualizationProps) {
  // Init load extract params state (safely).
  const query = await searchParams;
  const batchUuids = query?.b ? getSafeUuids(query?.b) : null;

  // Server action call to get visualization analytics.
  const visualizationAnalytics = await getVizAnalytics(batchUuids);

  return <VisualizationPage analytics={visualizationAnalytics} />;
}