'use server';

import { query } from "@/app/lib/db";
import { InputProcessorInterface } from "@/app/models/InputProcessor";
import { BatchInterface } from "@/app/models/Batch";
import { DataClassifier } from "@/app/models/DataClassifier";
import { DataRouter } from "@/app/models/DataRouter";

import { Nullable } from "../types/main";

import { mapFilterToStatement, mapSortToDBValue } from "@/app/lib/sql";
import { getSignedS3Urls } from "@/app/lib/s3";

import { AWS_BUCKET_NAME } from "../../../config/s3";

export type AnalyticsPoint = InputProcessorInterface & DataClassifier & DataRouter // add the '& other interface' (e.g. `& ClassifierInterface`) to combine objects.
export type ComputedValues = { totalTime: number, transcriptionUrl: string, groundTruthUrl: string, audioUrl: string }
export type DataPoint = AnalyticsPoint & ComputedValues
export type Data = DataPoint[]

export interface Paginator {
  analytics: Data;
  total: number;
  current: number;
  step: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OverviewAnalytics {
  batches: BatchInterface[];
  paginator: Paginator;
}

const PAGINATION_STEP = 10

// Notes for optimization:
// 1. send only what is needed on orderby or filter requests (not done currently).
export async function getOverviewAnalytics(
  batchUuids: Nullable<string[]> = null,
  orderBy: Nullable<string> = null,
  filterBy: Nullable<string> = null,
  entry: number = 1
): Promise<Nullable<OverviewAnalytics>> {
  // protect against sql injection (research tool so not as crucial at the moment).
  // here.
  try {
    // Batch of interest.
    let batchList = null;
    if (batchUuids) {
      // specific batch.
      batchList = await query<BatchInterface>(
        `SELECT * FROM Batch WHERE uuid IN (${batchUuids.map((uuid) => `'${uuid}'`).join(',')});`,
        false
      );
    } else {
      // the most recent.
      batchList = await query<BatchInterface>(
        `SELECT * FROM Batch ORDER BY created_at DESC LIMIT 1`,
        false
      );
    }
    const batchIDsStr = batchList.map((batch) => `${batch.batchID}`).join(',')

    // Resources on the query: https://learnsql.com/blog/sql-over-clause/
    // The other pipe pieces will be applied via left joins and using the batchID, fileID.
    const sqlQuery = [
      `SELECT ip.fileName, ip.bytes, ip.processingTime, ip.isValid, ip.shape, ip.uuid, dc.prediction, dc.classificationTime, dc.graph_x, dc.graph_y, dr.routingTime, dr.subtaskModel, dr.deliveryTime, dr.fileWordErrorRate, dr.transcriptionFilename, dr.groundTruthFilename, totalFiles.total as totalFiles FROM Batch`,
      'LEFT JOIN InputProcessor as ip ON Batch.BatchID = ip.batchID', // pipe piece 1: input process.
      'LEFT JOIN DataClassifier as dc ON Batch.BatchID = dc.batchID AND ip.fileID = dc.fileID', // pipe piece 2: data classifier.
      'LEFT JOIN DataRouter as dr ON Batch.BatchID = dr.batchID AND ip.fileID = dr.fileID', // pipe piece 3: data router.
      `JOIN (SELECT COUNT(*) as total FROM InputProcessor WHERE batchID IN (${batchIDsStr})${filterBy ? mapFilterToStatement(' AND ', filterBy) : ''}) as totalFiles`, // total.
      `WHERE Batch.batchID IN (${batchIDsStr}) ${filterBy ? mapFilterToStatement('AND ', filterBy) : ''} AND ip.fileID >= ${entry}`,
      `${orderBy ? `ORDER BY ${orderBy} DESC` : 'ORDER BY fileName ASC'}`, // assuming descending order (largest first). But can be later extended.
      `LIMIT ${PAGINATION_STEP};`
    ]

    // Analytics data.
    const analyticsDataResults = await query<DataPoint & { totalFiles: number }>(sqlQuery, false);

    // Get signed urls for transcription files.
    const transcriptionUrls = await getSignedS3Urls(AWS_BUCKET_NAME, analyticsDataResults.map((row) => row.transcriptionFilename));
    // Get signed urls for the ground truth files.
    const groundTruthUrls = await getSignedS3Urls(AWS_BUCKET_NAME, analyticsDataResults.map((row) => row.groundTruthFilename));
    // Get signed urls for the audio files.
    const audioUrls = await getSignedS3Urls(AWS_BUCKET_NAME, analyticsDataResults.map((row) => row.fileName));

    let total = 0;
    // Destructuring to remove a field.
    const analyticsData = analyticsDataResults.map(({ totalFiles, ...rest }) => {
      if (total === 0) total = totalFiles; // save for the first, rest same.

      // calculated fields.
      rest.totalTime = rest.processingTime + rest.classificationTime + rest.routingTime; // total time.
      if (transcriptionUrls) rest.transcriptionUrl = transcriptionUrls[rest.transcriptionFilename]; // signed s3 url.
      else rest.transcriptionUrl = "";
      if (groundTruthUrls) rest.groundTruthUrl = groundTruthUrls[rest.groundTruthFilename]; // signed s3 url.
      else rest.transcriptionUrl = "";
      if (audioUrls) rest.audioUrl = audioUrls[rest.fileName]; // signed s3 url.
      else rest.audioUrl = "";

      return rest
    })

    // Other pipe piece analytics.
    return {
      batches: batchList,
      paginator: {
        analytics: analyticsData,
        total: total,
        current: total !== 0 ? entry : 0,
        step: PAGINATION_STEP,
        hasNext: entry + PAGINATION_STEP <= total,
        hasPrev: entry - PAGINATION_STEP >= 1
      }
    }
  } catch (err) {
    console.error(err)
    return null;
    // return { msg: "Couldn't fetch overview contents." };
  }
}

export async function getTableAnalytics(
  batchUuids: string[],
  orderBy: Nullable<string> = null,
  filterBy: Nullable<string> = null,
  entry: number = 1
): Promise<Nullable<Paginator>> {
  // protect against sql injection (research tool so not as crucial at the moment).
  // here.
  try {
    const batchUuidStr = batchUuids.map((uuid) => `'${uuid}'`).join(',')

    // Resources on the query: https://learnsql.com/blog/sql-over-clause/
    // The other pipe pieces will be applied via left joins and using the batchID, fileID.
    const sqlQuery = [
      `SELECT ip.fileName, ip.bytes, ip.processingTime, ip.isValid, ip.shape, ip.uuid, dc.prediction, dc.classificationTime, dc.graph_x, dc.graph_y, dr.routingTime, dr.subtaskModel, dr.deliveryTime, dr.fileWordErrorRate, dr.transcriptionFilename, dr.groundTruthFilename, (SELECT COUNT(*) FROM InputProcessor WHERE Batch.uuid IN (${batchUuidStr}) ${filterBy ? mapFilterToStatement('AND ', filterBy) : ''}) as totalFiles FROM Batch`,
      'LEFT JOIN InputProcessor as ip ON Batch.BatchID = ip.batchID', // pipe piece 1: input process.
      'LEFT JOIN DataClassifier as dc ON Batch.BatchID = dc.batchID AND ip.fileID = dc.fileID', // pipe piece 2: data classifier.
      'LEFT JOIN DataRouter as dr ON Batch.BatchID = dr.batchID AND ip.fileID = dr.fileID', // pipe piece 3: data router.
      `WHERE Batch.uuid IN (${batchUuidStr}) ${filterBy ? mapFilterToStatement('AND ', filterBy) : ''} AND ip.fileID >= ${entry}`,
      `${orderBy ? `ORDER BY ${mapSortToDBValue(orderBy)} DESC` : ''}`,
      `LIMIT ${PAGINATION_STEP};`
    ]

    // Analytics data.
    const analyticsDataResults = await query<DataPoint & { totalFiles: number }>(sqlQuery, false);

    // Get signed urls for transcription files.
    const transcriptionUrls = await getSignedS3Urls(AWS_BUCKET_NAME, analyticsDataResults.map((row) => row.transcriptionFilename));
    // Get signed urls for the ground truth files.
    const groundTruthUrls = await getSignedS3Urls(AWS_BUCKET_NAME, analyticsDataResults.map((row) => row.groundTruthFilename));
    // Get signed urls for the audio files.
    const audioUrls = await getSignedS3Urls(AWS_BUCKET_NAME, analyticsDataResults.map((row) => row.fileName));

    let total = 0;
    // Destructuring to remove a field + additional convenience fields.
    const analyticsData = analyticsDataResults.map(({ totalFiles, ...rest }) => {
      if (total === 0) total = totalFiles; // save for the first, rest same.
      // calculated fields.
      rest.totalTime = rest.processingTime + rest.classificationTime + rest.routingTime; // total time.
      if (transcriptionUrls) rest.transcriptionUrl = transcriptionUrls[rest.transcriptionFilename]; // signed s3 url.
      else rest.transcriptionUrl = "";
      if (groundTruthUrls) rest.groundTruthUrl = groundTruthUrls[rest.groundTruthFilename]; // signed s3 url.
      else rest.transcriptionUrl = "";
      if (audioUrls) rest.audioUrl = audioUrls[rest.fileName]; // signed s3 url.
      else rest.audioUrl = "";

      return rest
    })

    return {
      analytics: analyticsData,
      total: total,
      current: total !== 0 ? entry : 0,
      step: PAGINATION_STEP,
      hasNext: entry + PAGINATION_STEP <= total,
      hasPrev: entry - PAGINATION_STEP >= 1
    }
  } catch (err) {
    console.error(err)
    return null;
    // return { msg: "Couldn't fetch overview contents." };
  }
}