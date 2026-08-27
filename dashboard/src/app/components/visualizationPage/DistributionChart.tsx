'use client';

import DividerSection from "@/app/components/reusable/DividerSection";
import Panel from "@/app/components/reusable/Panel";

import SankeyChart from "@/app/components/reusable/SankeyChart";

import { createSankeyChartData } from "@/app/lib/components/sankeychart";

import { VisualizationAnalytics } from "@/app/actions/viz";
import { Nullable } from "@/app/types/main";

interface DistributionChartProps {
  analytics: Nullable<VisualizationAnalytics>;
}

const DistributionChart = ({ analytics }: DistributionChartProps) => {
  const distributionAnalytics = analytics?.distributionAnalytics ?? [];

  return (
    <>
     <DividerSection sectionTitle="Routing">
        <Panel>
          <SankeyChart data={createSankeyChartData(
              distributionAnalytics,
              (d) => `Subtask ${d.prediction}\nWER: ${(d.WER * 100).toFixed(0)}%`,
              (d) => d.routedCount,
              'Total',
              distributionAnalytics[0]?.routedTotal
            )}
          />
        </Panel>
      </DividerSection>
    </>
  )
}

export default DistributionChart;