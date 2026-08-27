'use client';

import { useEffect, useState } from "react";

import AggregateBoard from "@/app/components/overviewPage/AggregateBoard";
import MasterTable from "@/app/components/overviewPage/MasterTable";

import { useBatchStore } from "@/app/store/batchStore";

import { Nullable } from "@/app/types/main";
import { getOverviewAnalytics, OverviewAnalytics } from "@/app/actions/overview";

interface OverviewPageProps {
  analytics: Nullable<OverviewAnalytics>
}

const OverviewPage = ({ analytics }: OverviewPageProps) => {
  const [analyticsState, setAnalyticsState] = useState(analytics)

  useEffect(() => {
    const unsubscribeBatchStore = useBatchStore.subscribe(
      ({ selectedBatch }) => {
        getOverviewAnalytics(selectedBatch.map((batch) => batch.uuid))
          .then(res => {
            setAnalyticsState(res)
          })
          .catch(err => {
            console.error(err)
          })
      },
    );

    return () => unsubscribeBatchStore();
  }, []);

  return (
    <>
      <AggregateBoard analytics={analyticsState}/>
      <MasterTable analytics={analyticsState}/>
    </>
  )
}

export default OverviewPage;