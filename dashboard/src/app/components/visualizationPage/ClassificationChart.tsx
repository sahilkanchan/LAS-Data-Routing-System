'use client';

import DividerSection from "@/app/components/reusable/DividerSection";
import Panel from "@/app/components/reusable/Panel";

import ScatterPlot from "@/app/components/reusable/ScatterPlot";

import { createScatterPlotDataPoints, createScatterPlotMarkers } from "@/app/lib/components/scatterplot";
import { generateHexColor } from "@/app/lib/common";

import { VisualizationAnalytics } from "@/app/actions/viz";
import { Nullable } from "@/app/types/main";

interface ClassificationChartProps {
  analytics: Nullable<VisualizationAnalytics>;
}

const ClassificationChart = ({ analytics }: ClassificationChartProps) => {
    const classificationAnalytics = analytics?.classificationAnalytics;
    const scatterplotData = classificationAnalytics?.points ?? [];
    const centroids = classificationAnalytics?.centroids ?? [];

    return (
      <>
        <DividerSection sectionTitle="Clustering">
          <Panel>
            <div className="p-4">
              <ScatterPlot
                dataPoints={createScatterPlotDataPoints(
                  scatterplotData,
                  (d) => d.graph_x,
                  (d) => d.graph_y,
                  (d) => generateHexColor(d.prediction, [0, 360]),
                  (d) => `Subtask ${d.prediction}`
                )}
                title="Subtask Model Plot"
                xLabel="Component 1"
                yLabel="Component 2"
                showGrid={true}
                showLegend={true}
                numericalPadding={{ left: 2, right: 2, top: 2, bottom: 2 }}
                markers={createScatterPlotMarkers(centroids, (d) => d.graph_x, (d) => d.graph_y, (d) => `Centroid ${d.centroid}`)}
              />
            </div>
          </Panel>
        </DividerSection>
      </>
    )
}

export default ClassificationChart;