import type { Metadata } from "next";

import { getOverviewAnalytics } from "@/app/actions/overview";
import OverviewPage from "@/app/components/overviewPage/OverviewPage";

import { ServerParams } from "@/app/types/main";
import { getSafeUuids } from "@/app/lib/common";

export const metadata: Metadata = {
  title: "Overview",
  description: "Overview page for the LAS Dashboard.",
};

interface OverviewProps extends ServerParams {
  searchParams?: Promise<{ b: string }>;
}

export default async function Overview({ searchParams }: OverviewProps) {
  // Init load extract params state (safely).
  const query = await searchParams;
  const batchUuids = query?.b ? getSafeUuids(query?.b) : null;

  // Server action call to get overview analytics.
  // Fetch content for this page using higher level batch.
  // Use components for fine grained control over state.
  const latestBatchAnalytics = await getOverviewAnalytics(batchUuids);

  return <OverviewPage analytics={latestBatchAnalytics}/>;
}
