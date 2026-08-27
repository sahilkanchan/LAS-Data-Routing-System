
export interface BarChartDatum<D> {
  id: number;
  category: string;
  value: number;
  color?: string;
  data: D;
}

export function createBarChartData<D>(
  data: D[],
  getCategory: (d: D) => string,
  getValue: (d: D) => number,
  getColor?: (d: D) => string
): BarChartDatum<D>[] {
  return data.map((d, idx) => ({
    id: idx,
    category: getCategory(d),
    value: getValue(d),
    color: getColor ? getColor(d) : "#000000",
    data: d
  }));
}