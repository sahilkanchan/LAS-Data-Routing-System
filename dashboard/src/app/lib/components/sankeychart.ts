interface SankeyChartData {
  nodes: SankeyChartNode[];
  links: SankeyChartLink[];
}

interface SankeyChartNode {
  name: string;
  value: number;
}

interface SankeyChartLink {
  source: number;
  target: number;
  value: number;
}

export function createSankeyChartData<D>(
  data: D[],
  getNodeName: (d: D) => string,
  getNodeValue: (d: D) => number,
  totalTitle?: string,
  totalValue?: number
): SankeyChartData {
  const nodes = data.map((d) => ({
    name: getNodeName(d),
    value: getNodeValue(d)
  }))
  nodes.unshift({
    name: totalTitle ?? 'Total',
    value: totalValue ?? nodes.reduce((total, node) => total + node.value, 0)
  })

  const links = data.map((d, idx) => ({
    source: 0,
    target: idx + 1,
    value: getNodeValue(d)
  }))

  return {
    nodes: nodes,
    links: links
  }
}