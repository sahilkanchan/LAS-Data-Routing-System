'use client';

import { useMemo } from "react";

import { scaleLinear, scaleOrdinal } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { GridRows, GridColumns } from "@visx/grid";
import { GlyphDiamond } from "@visx/glyph";
import { Legend, LegendItem, LegendLabel } from "@visx/legend";
import { useParentSize } from "@visx/responsive";
import React from "react";

import { DataPoint, ObjectMarker } from "@/app/lib/components/scatterplot";

const SCREEN_ASPECT_RATIO = 16 / 9;
const SCREEN_ADAPT_DEBOUNCE_TIME = 50;
const DEFAULT_PADDING = { top: 20, right: 20, bottom: 40, left: 30 };
const DEFAULT_NUMERICAL_PADDING = { top: 10, right: 10, bottom: 10, left: 10 };

type RectangularSides = { top: number, right: number, bottom: number, left: number };

interface ScatterPlotProps<D> {
  dataPoints: DataPoint<D>[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  numericalPadding?: RectangularSides;
  padding?: RectangularSides;
  markers?: ObjectMarker[];
  showLegend?: boolean;
  showGrid?: boolean;
}

const ScatterPlot = <D,>({
  dataPoints,
  title,
  xLabel,
  yLabel,
  numericalPadding = DEFAULT_NUMERICAL_PADDING,
  padding = DEFAULT_PADDING,
  markers,
  showLegend = false,
  showGrid = false
}: ScatterPlotProps<D>) => {
  // Adapting to screen size.
  const { parentRef, width } = useParentSize({ debounceTime: SCREEN_ADAPT_DEBOUNCE_TIME });
  const height = width / SCREEN_ASPECT_RATIO;

  // Compute x, y scales dynamically but reducing computations (persist across component updates).
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    return dataPoints.reduce(
      (acc, { x, y }) => ({
        xMin: Math.min(acc.xMin, x),
        xMax: Math.max(acc.xMax, x),
        yMin: Math.min(acc.yMin, y),
        yMax: Math.max(acc.yMax, y),
      }),
      { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity }
    );
  }, [dataPoints]);

  const xScale = useMemo(() =>
      scaleLinear({
        domain: [xMin - numericalPadding.left, xMax + numericalPadding.right],
        range: [padding.left, width - padding.right],
      }),
    [xMin, xMax, width, padding, numericalPadding]
  );

  const yScale = useMemo(() =>
      scaleLinear({
        domain: [yMin - numericalPadding.bottom, yMax + numericalPadding.top],
        range: [height - padding.bottom, padding.top],
      }),
    [yMin, yMax, height, padding, numericalPadding]
  );

  const legendScale = useMemo(() => {
    if (!showLegend) return null;

    const categoryColorMap = new Map();

    for (const { category, color } of dataPoints) {
      if (category && color && !categoryColorMap.has(category)) {
        categoryColorMap.set(category, color);
      }
    }

    return scaleOrdinal({
      domain: Array.from(categoryColorMap.keys()),
      range: Array.from(categoryColorMap.values())
    });
  }, [dataPoints, showLegend]);

  return (
    <div className="block relative w-full">
      <div ref={parentRef} className="w-full aspect-video">
        <svg width={width} height={height}>
          {/* Title */}
          <text
            x={width * 0.54}
            y={padding.top * 0.6}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
          >
            { title }
          </text>

          <Group left={padding.left}>
            {
              showGrid && (
                <>
                  {/* Grid Rows (Horizontal Lines) */}
                  <GridRows
                    scale={yScale}
                    width={width - padding.left - padding.right}
                    left={padding.left} // Start grid after the Y-axis
                    stroke="#e0e0e0"
                  />

                  {/* Grid Columns (Vertical Lines) */}
                  <GridColumns
                    scale={xScale}
                    height={height - padding.top - padding.bottom}
                    top={padding.top} // Start grid after the toppadding
                    stroke="#e0e0e0"
                  />
                </>
              )
            }

            {/* X-Axis */}
            <AxisBottom
              scale={xScale}
              top={height - padding.bottom}
              label={xLabel}
              labelClassName="text-sm"
            />
            {/* Y-Axis */}
            <AxisLeft
              scale={yScale}
              left={padding.left}
              label={yLabel}
              labelClassName="text-sm"
            />

            {/* Markers. */}
            {
              markers && (markers.map((marker, idx) => (
                <GlyphDiamond
                  key={idx}
                  left={xScale(marker.x)}
                  top={yScale(marker.y)}
                  size={50} // Star size
                  fill="red"
                  stroke="black"
                />
              )))
            }

            {/* Scatter Points */}
            {dataPoints.map((d, i) => (
              <Circle
                key={i}
                cx={xScale(d.x)}
                cy={yScale(d.y)}
                r={2}
                fill={d.color}
              />
            ))}
          </Group>
        </svg>
      </div>
      {
        legendScale && (
          <div className="absolute top-3 right-0 flex items-center p-2 bg-white rounded-md border border-gray-300">
            <Legend scale={legendScale}>
                {(labels) => (
                  <div>
                    {labels.map((label, i) => {
                      const legendGlyphSize = 10;
                      return (
                        <LegendItem
                          key={`legend-quantile-${i}`}
                          className="flex items-center space-x-5"
                        >
                          <div className="p-1">
                            <svg width={legendGlyphSize} height={legendGlyphSize}>
                              <rect fill={label.value} width={legendGlyphSize} height={legendGlyphSize} />
                            </svg>
                          </div>
                          <LegendLabel className="text-xs">
                            {label.text}
                          </LegendLabel>
                        </LegendItem>
                      );
                    })}
                  </div>
                )}
            </Legend>
          </div>
        )
      }
    </div>
  );
};

export default ScatterPlot;