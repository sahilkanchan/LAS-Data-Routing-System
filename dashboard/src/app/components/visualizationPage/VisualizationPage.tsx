'use client';

import { useState, useEffect } from "react";

// import ClassificationChart from "@/app/components/visualizationPage/ClassificationChart";
import DistributionChart from "@/app/components/visualizationPage/DistributionChart";

import { VisualizationAnalytics } from "@/app/actions/viz";
import { Nullable } from "@/app/types/main";

import { useBatchStore } from "@/app/store/batchStore";
import { getVizAnalytics } from "@/app/actions/viz";

interface VisualizationPageProps {
  analytics: Nullable<VisualizationAnalytics>;
}

const VisualizationPage = ({ analytics }: VisualizationPageProps) => {
  // Init state for analytics.
  const [analyticsState, setAnalyticsState] = useState(analytics);

  useEffect(() => {
    const unsubscribeBatchStore = useBatchStore.subscribe(
      ({ selectedBatch }) => {
        getVizAnalytics(selectedBatch.map((batch) => batch.uuid))
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
      <DistributionChart analytics={analyticsState} />
      {/* <ClassificationChart analytics={analyticsState} /> */}
    </>
  );
};

export default VisualizationPage;
