import { query } from "@/app/lib/db";

import { Nullable } from "@/app/types/main";
import { BatchInterface } from "@/app/models/Batch";
import { sqlWhereIn } from "@/app/lib/sql";

import { DistributionPlotData, DistributionPlotPoint } from "@/app/actions/viz";
import { Data, DataPoint } from "@/app/actions/overview";

import { mapFilterToStatement, mapSortToDBValue } from "@/app/lib/sql";

export interface PDFReportContent {
  batches: Nullable<BatchInterface[]>;
  distributionData: Nullable<DistributionPlotData>;
  fileTableData: Nullable<Data>;
}

export interface FileTableOptions {
  orderBy: Nullable<string>;
  filterBy: Nullable<string>;
}

async function getBatchData(
  batchUuids: Nullable<string[]>
) {
  try {
    const sqlWhereInBatches = batchUuids ? sqlWhereIn("uuid", batchUuids) : '';
    const sqlWhereFirstBatch = 'ORDER BY created_at ASC LIMIT 1';

    const batchesSQL = [
      'SELECT * FROM Batch',
      batchUuids ? sqlWhereInBatches : sqlWhereFirstBatch
    ]
    const batches = await query<BatchInterface>(batchesSQL, false);

    return batches;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getDistributionPlotData(
  batchUuids: Nullable<string[]>
): Promise<Nullable<DistributionPlotData>> {
  try {
    // Some helpful sql pieces.
    const sqlWhereInBatches = batchUuids ? sqlWhereIn('Batch.uuid', batchUuids) : ''
    const sqlWhereFirstBatch = `WHERE Batch.batchID = (SELECT MIN(Batch.batchID) FROM DataClassifier)`
    const sqlLeftJoinBatches = `LEFT JOIN Batch ON DataClassifier.batchID = Batch.batchID`

    // Querying the distribution of the files for Sanky chart.
    const distributionSQL = [
      'SELECT prediction, COUNT(fileID) as routedCount, CAST(SUM(COUNT(fileID)) OVER () AS UNSIGNED) as routedTotal FROM DataClassifier',
      sqlLeftJoinBatches,
      batchUuids ? sqlWhereInBatches : sqlWhereFirstBatch,
      'GROUP BY prediction;'
    ]
    const distributionData = await query<DistributionPlotPoint>(distributionSQL, false);

    return distributionData
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getFileTableData(
  batchIds: number[],
  filterBy: Nullable<string> = null,
  orderBy: Nullable<string> = null
): Promise<Nullable<Data>> {
  try {
    const batchIDsStr = batchIds.join(',')

    // Resources on the query: https://learnsql.com/blog/sql-over-clause/
    // The other pipe pieces will be applied via left joins and using the batchID, fileID.
    const sqlQuery = [
      `SELECT ip.fileName, ip.bytes, ip.processingTime, ip.isValid, ip.shape, ip.uuid, dc.prediction, dc.classificationTime, dc.graph_x, dc.graph_y, dr.routingTime, dr.subtaskModel, dr.deliveryTime, dr.fileWordErrorRate, dr.transcriptionFilename FROM Batch`,
      'LEFT JOIN InputProcessor as ip ON Batch.BatchID = ip.batchID', // pipe piece 1: input process.
      'LEFT JOIN DataClassifier as dc ON Batch.BatchID = dc.batchID AND ip.fileID = dc.fileID', // pipe piece 2: data classifier.
      'LEFT JOIN DataRouter as dr ON Batch.BatchID = dr.batchID AND ip.fileID = dr.fileID', // pipe piece 3: data router.
      // `JOIN (SELECT COUNT(*) as total FROM InputProcessor WHERE batchID IN (${batchIDsStr})${filterBy ? mapFilterToStatement(' AND ', filterBy) : ''}) as totalFiles`, // total.
      `WHERE Batch.batchID IN (${batchIDsStr}) ${filterBy ? mapFilterToStatement('AND ', filterBy) : ''}`,
      `${orderBy ? `ORDER BY ${mapSortToDBValue(orderBy)} DESC` : ''}`,
    ]
    // const sqlQuery = [
    //   `SELECT ip.fileName, ip.bytes, ip.processingTime, ip.isValid, ip.shape, ip.uuid, (SELECT COUNT(*) FROM InputProcessor WHERE Batch.uuid IN (${batchUuidStr}) ${filterBy ? mapFilterToStatement('AND ', filterBy) : ''}) as totalFiles FROM Batch`,
    //   'LEFT JOIN InputProcessor as ip ON Batch.BatchID = ip.batchID',
    //   `WHERE Batch.uuid IN (${batchUuidStr}) ${filterBy ? mapFilterToStatement('AND ', filterBy) : ''} AND ip.fileID >= ${entry}`,
    //   `${orderBy ? `ORDER BY ${mapSortToDBValue(orderBy)} DESC` : ''}`,
    //   `LIMIT ${PAGINATION_STEP};`
    // ]

    // Analytics data.
    const data = await query<DataPoint>(sqlQuery, false);

    // Applying computed fields.
    data.forEach((row) => {
      row.totalTime = row.processingTime + row.classificationTime + row.routingTime;
    })

    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getPDFReportContent(
  batchUuids: Nullable<string[]>,
  fileTableOptions: Nullable<FileTableOptions> = null
): Promise<Nullable<PDFReportContent>> {
  const batches = await getBatchData(batchUuids);
  const distributionData = await getDistributionPlotData(batchUuids);
  const fileTableData = await getFileTableData(batches?.map(
    (batch) => batch.batchID) ?? [],
    fileTableOptions?.filterBy,
    fileTableOptions?.orderBy
  );

  return {
    batches: batches,
    distributionData: distributionData,
    fileTableData: fileTableData
  }
}