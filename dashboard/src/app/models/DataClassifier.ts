export interface DataClassifier {
  fileID?: number;
  batchID?: number;
  prediction: number;
  classificationTime: number;
  graph_x: number;
  graph_y: number;
  uuid: string;
}