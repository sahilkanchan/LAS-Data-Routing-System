export interface DataRouter {
  fileID?: number;
  batchID?: number;
  routingTime: number;
  subtaskModel: string;
  deliveryTime: number;
  fileWordErrorRate: number;
  transcriptionFilename: string;
  groundTruthFilename: string;
  uuid: string;
}