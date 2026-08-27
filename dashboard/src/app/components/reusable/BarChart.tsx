'use client';

import React, { useMemo } from 'react';
import { useParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Bar } from '@visx/shape';
import { GridRows, GridColumns } from '@visx/grid';

import { BarChartDatum } from '@/app/lib/components/barchart';

const SCREEN_ASPECT_RATIO = 16 / 9;
const SCREEN_ADAPT_DEBOUNCE_TIME = 50;
const DEFAULT_PADDING = { top: 20, right: 20, bottom: 40, left: 60 };

type RectangularSides = { top: number; right: number; bottom: number; left: number };

interface BarChartProps<D> {
  data: BarChartDatum<D>[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  padding?: RectangularSides;
  showGrid?: boolean;
}

const BarChart = <D,>({
  data,
  title,
  xLabel,
  yLabel,
  padding = DEFAULT_PADDING,
  showGrid = false,
}: BarChartProps<D>) => {
  const { parentRef, width } = useParentSize({ debounceTime: SCREEN_ADAPT_DEBOUNCE_TIME });
  const height = width / SCREEN_ASPECT_RATIO;

  const xScale = useMemo(() =>
      scaleBand({
        domain: data.map((d) => d.category),
        padding: 0.2,
        range: [padding.left, width - padding.right],
      }),
    [data, width, padding]
  );

  const { yMax} = useMemo(() => {
    const yMax = Math.max(...data.map((d) => d.value), 0);
    return { yMax }
  }, [data])

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, yMax],
        nice: true,
        range: [height - padding.bottom, padding.top],
      }),
    [yMax, height, padding]
  );

  return (
    <div className="block relative w-full">
      <div ref={parentRef} className="w-full aspect-video">
        <svg width={width} height={height}>
          {/* Title */}
          <text
            x={width / 2}
            y={padding.top * 0.6}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
          >
            {title}
          </text>

          {showGrid && (
            <>
              <GridRows
                scale={yScale}
                width={width - padding.left - padding.right}
                left={padding.left}
                stroke="#e0e0e0"
              />
              <GridColumns
                scale={xScale}
                height={height - padding.top - padding.bottom}
                top={padding.top}
                stroke="#e0e0e0"
              />
            </>
          )}

          {/* Axes */}
          <AxisBottom
            scale={xScale}
            top={height - padding.bottom}
            label={xLabel}
            labelClassName="text-sm"
          />
          <AxisLeft
            scale={yScale}
            left={padding.left}
            label={yLabel}
            labelClassName="text-sm"
          />

          {/* Bars */}
          <Group>
            {data.map((d, i) => (
              <Bar
                key={i}
                x={xScale(d.category)}
                y={yScale(d.value)}
                width={xScale.bandwidth()}
                height={height - padding.bottom - yScale(d.value)}
                fill={d.color || '#4f46e5'}
              />
            ))}
          </Group>
        </svg>
      </div>
    </div>
  );
};

export default BarChart;
