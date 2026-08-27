'use client';

import React from 'react';
import {
  XYChart,
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  Tooltip,
} from '@visx/xychart';

type Datum = { x: number; y: number };

const sampleData: Datum[] = [
  { x: 0, y: 50 },
  { x: 10, y: 30 },
  { x: 20, y: 65 },
  { x: 30, y: 15 },
  { x: 40, y: 90 },
];

const LineChart: React.FC = () => {
  // Accessors tell VisX how to read your data objects.
  const accessors = {
    xAccessor: (d: Datum) => d.x,
    yAccessor: (d: Datum) => d.y,
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
      <XYChart
        height={400}
        xScale={{ type: 'linear' }}
        yScale={{ type: 'linear' }}
      >
        <AnimatedGrid columns={false} numTicks={5} />
        <AnimatedAxis orientation="bottom" numTicks={5} />
        <AnimatedAxis orientation="left" numTicks={5} />
        <AnimatedLineSeries
          dataKey="Line 1"
          data={sampleData}
          xAccessor={accessors.xAccessor}
          yAccessor={accessors.yAccessor}
        />
        <Tooltip<Datum>
          showHorizontalCrosshair
          showVerticalCrosshair
          snapTooltipToDatumX
          snapTooltipToDatumY
          renderTooltip={({ tooltipData }) => {
            if (!tooltipData?.nearestDatum) return null;
            const { x, y } = tooltipData.nearestDatum.datum as Datum;
            return (
              <div className="p-1 text-sm bg-white border border-gray-300">
                <p>X: {x}</p>
                <p>Y: {y}</p>
              </div>
            );
          }}
        />
      </XYChart>
    </div>
  );
};

export default LineChart;
