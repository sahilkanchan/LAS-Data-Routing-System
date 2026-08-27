'use server';

import { query } from "@/app/lib/db";

import { DataClassifier } from "@/app/models/DataClassifier";
import { Nullable } from "@/app/types/main";
import { Centroid } from "@/app/models/Centroid";

// sql builders
import { sqlWhereIn } from "@/app/lib/sql";

export type ScatterPlotData = {
  points: DataClassifier[] // add the '& other interface'.
  centroids: Centroid[]
}
export type DistributionPlotPoint = {
  prediction: number;
  routedCount: number;
  WER: number;
  routedTotal: number;
}
export type DistributionPlotData = DistributionPlotPoint[]

export interface VisualizationAnalytics {
  distributionAnalytics: DistributionPlotData;
  classificationAnalytics: ScatterPlotData;
}

export async function getVizAnalytics(
  batchUuids: Nullable<string[]>
): Promise<Nullable<VisualizationAnalytics>> {
  try {
    // Probably best to sanitize the batch uuids here.
    // here.

    // Some helpful sql pieces.
    const sqlWhereInBatches = batchUuids ? sqlWhereIn('Batch.uuid', batchUuids) : ''
    const sqlWhereFirstBatch = `WHERE Batch.batchID = (SELECT MIN(Batch.batchID) FROM DataClassifier)`
    const sqlLeftJoinBatches = `LEFT JOIN Batch ON DataClassifier.batchID = Batch.batchID`

    // Querying all scatter points (optimization: sql streaming).
    const scatterPlotSQL = [
      'SELECT prediction, graph_x, graph_y, DataClassifier.uuid FROM DataClassifier',
      sqlLeftJoinBatches,
      batchUuids ? sqlWhereInBatches : sqlWhereFirstBatch,
    ]

    const scatterPlotData = await query<DataClassifier>(scatterPlotSQL, false);

    // Querying all centroids (optimization: sql streaming).
    const centroidSQL = [
      'SELECT centroid, graph_x, graph_y, Centroids.uuid FROM Centroids',
      'LEFT JOIN Model ON Centroids.modelID = Model.modelID',
      'LEFT JOIN Batch ON Model.batchID = Batch.batchID',
      batchUuids ? sqlWhereInBatches : sqlWhereFirstBatch,
    ]
    const centroids = await query<Centroid>(centroidSQL, false);

    // Querying the distribution of the files for Sanky chart.
    const distributionSQL = [
      'SELECT prediction, COUNT(DataClassifier.fileID) as routedCount, AVG(dr.fileWordErrorRate) as WER, CAST(SUM(COUNT(DataClassifier.fileID)) OVER () AS UNSIGNED) as routedTotal FROM DataClassifier',
      sqlLeftJoinBatches,
      'LEFT JOIN DataRouter as dr ON DataClassifier.fileID = dr.fileID AND DataClassifier.batchID = dr.batchID',
      batchUuids ? sqlWhereInBatches : sqlWhereFirstBatch,
      'GROUP BY prediction;'
    ]
    const distributionData = await query<DistributionPlotPoint>(distributionSQL, false);

    return {
      distributionAnalytics: distributionData,
      classificationAnalytics: {
        points: scatterPlotData,
        centroids: centroids
      }
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}