
export interface DataPoint<D> {
  id: number;
  x: number;
  y: number;
  color: string;
  category: string;
  data: D
}

export interface ObjectMarker {
  label: string;
  x: number;
  y: number;
};

export function createScatterPlotDataPoints<D>(
  data: D[],
  getX: (d: D) => number,
  getY: (d: D) => number,
  getColor?: (d: D) => string,
  getCategory?: (d: D) => string
): DataPoint<D>[] {
  return data.map((d, idx) => ({
    id: idx,
    x: getX(d),
    y: getY(d),
    color: getColor ? getColor(d) : "#000000",
    category: getCategory ? getCategory(d) : "All",
    data: d
  }));
}

export function createScatterPlotMarkers<D>(
  markers: D[],
  getX: (d: D) => number,
  getY: (d: D) => number,
  getLabel?: (d: D) => string,
): ObjectMarker[] {
  return markers.map((d, idx) => ({
    label: getLabel ? getLabel(d) : `Marker ${idx + 1}`,
    x: getX(d),
    y: getY(d)
  }));
}