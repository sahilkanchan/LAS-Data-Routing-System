'use client';

import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

export interface SankeyNode {
  name: string;  
  value: number; 
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface TextOffset {
  offsetX: number;
  offsetY: number;
  alignment: string;
}

export interface SankeyChartProps {
  data: SankeyData;
  textOffsets?: TextOffset[];
}

const defaultTextOffsets: TextOffset[] = [
  { offsetX: 10, offsetY: 0, alignment: 'central' },
  { offsetX: -190, offsetY: -10, alignment: 'middle' },
  { offsetX: -190, offsetY: -10, alignment: 'middle' },
  { offsetX: -190, offsetY: -10, alignment: 'middle' },
  { offsetX: -190, offsetY: -10, alignment: 'middle' },
];

const SankeyChart = ({ data, textOffsets = defaultTextOffsets }: SankeyChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <Sankey
        data={data}
        nodePadding={30}
        nodeWidth={15}
        link={{ stroke: '#aaa' }}
        node={({ x, y, width, height, index }) => {
          // 1) Get the full node label + file count
          //    E.g. name = "Subtask 3\nWER: 17%", value = 2
          const { name, value } = data.nodes[index];

          // 2) Split the name on "\n" to separate subtask line from WER line
          const lines = name.split('\n');
          const subtaskLine = lines[0] ?? '';
          const werLine = lines[1] ?? '';

          // 3) If node[0] is "Total", skip ratio. Otherwise compute ratio
          const totalValue = data.nodes[0]?.value ?? 1;  // The total node’s file count
          let filesLine = `${value} Files`;
          if (index !== 0 && totalValue > 0) {
            const ratio = ((value / totalValue) * 100).toFixed(1);
            filesLine += ` (${ratio}%)`;
          }

          // 4) Offsets for label text
          const { offsetX, offsetY } = textOffsets[index] || { offsetX: 6, offsetY: 0 };

          return (
            <>
              <rect
                x={x - 200}
                y={y}
                width={width}
                height={height}
                stroke="#333"
                fill="#ccc"
              />
              <text
                x={x + width + offsetX}
                y={y + height / 2 + offsetY}
                fontSize={12}
                fill="#000"
              >
                {/* 1st line: Number of subtask model */}
                <tspan x={x + width + offsetX} dy="0em">
                  {subtaskLine}
                </tspan>
                {/* 2nd line: The word error rate */}
                {werLine && (
                  <tspan x={x + width + offsetX} dy="1.2em">
                    {werLine}
                  </tspan>
                )}
                {/* 3rd line: Number of files */}
                <tspan x={x + width + offsetX} dy="1.2em">
                  {filesLine}
                </tspan>
              </text>
            </>
          );
        }}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  );
};

export default SankeyChart;
