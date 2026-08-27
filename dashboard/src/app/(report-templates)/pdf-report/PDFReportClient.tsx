'use client';

import Image from 'next/image';
import dayjs from "dayjs";

import Table from "@/app/components/reusable/Table";
import SankeyChart from "@/app/components/reusable/SankeyChart";

import { APP_VERSION, APP_FULL_NAME } from "../../../../config/app";
import { REPORTS_DATA_SOURCE } from "../../../../config/reports";

import { Nullable } from "@/app/types/main";
import { FileTableOptions } from '@/app/actions/template';
import { PDFReportContent } from "@/app/actions/template";

import { createTableRows } from "@/app/lib/components/table";
import { createSankeyChartData } from "@/app/lib/components/sankeychart";
import { getFormattedDate, getFormattedRepresentation, MS_IN_SEC, getFormattedStorageSize } from "@/app/lib/common";

// TOC.
const toc = [
  {
    title: "Batches Reporting",
    href: "#batches-reporting",
  },
  {
    title: "Aggregate Statistics",
    href: "#aggregate-statistics",
  },
  {
    title: "Routing Decision",
    href: "#routing-decision",
  },
  {
    title: "Files",
    href: "#files",
  }
]

const batchHeaders = ['UUID', 'Files', 'Created At', 'Time', 'Benchmark', 'Word Error Rate']
const aggregateStatisticsHeaders = ['Total Time', 'Total Files', 'WER']
const tableHeaders = ['Filename', 'Size', 'Processing Time', 'Classification Time', 'Routing Time', 'Total Time', 'Prediction', 'WER', 'Subtask Model']

const EMPTY_COL_PLACEHOLDER = 'N/A'

interface PDFReportClientProps {
  content: Nullable<PDFReportContent>;
  hash: string;
  tableOptions: Nullable<FileTableOptions & { colNames: Nullable<string[]> }>;
}

const PDFReportClient = ({ content, hash, tableOptions }: PDFReportClientProps) => {
  const todaysDate = dayjs().format("YYYY-MM-DD HH:mm");

  // Meta data.
  const generatedAt = dayjs().format("YYYY-MM-DD HH:mm");

  // Report contents.
  // Batches.
  const batches = content?.batches ?? null;
  const batchTableRows = batches ? createTableRows(
    batches,
    (batch) => [
      batch.uuid,
      batch.numFiles.toString(),
      getFormattedDate('YYYY-MM-DD HH:mm:ss', batch.created_at),
      getFormattedRepresentation(batch.totalTime, 1000, (num, dec) => `${num}s ${dec}ms`),
      batch.benchmark ? 'Yes' : 'No',
      batch.batchWordErrorRate ? `${batch.batchWordErrorRate}%` : EMPTY_COL_PLACEHOLDER
    ]
  ) : [];

  // Report period.
  const startPeriod = batches ? getFormattedDate('MMMM D, YYYY', batches[0].created_at) : null;
  const endPeriod = batches ? getFormattedDate('MMMM D, YYYY', batches[batches.length - 1].created_at) : null;
  let reportPeriod = `${startPeriod} - ${endPeriod}`;
  if (startPeriod && startPeriod === endPeriod) {
    reportPeriod = startPeriod;
  } else if (endPeriod && startPeriod === endPeriod) {
    reportPeriod = endPeriod;
  }

  // Aggregate statistics.
  const totalTime = batches ? getFormattedRepresentation(batches.reduce((totalTime, batch) => totalTime + batch.totalTime, 0), MS_IN_SEC, (num, dec) => `${num}s ${dec}ms`) : null;
  const numFiles = batches ? batches.reduce((numFiles, batch) => numFiles + batch.numFiles, 0) : null;

  const allNonBenchmark = batches ? batches.every((batch) => !batch.benchmark) : false;
  const allNonBWER = batches ? batches.every((batch) => !batch.batchWordErrorRate) : false;
  const numBenchmark = batches ? batches.filter((batch) => batch?.benchmark).length : 1;
  const isAvgBWER = batches ? numBenchmark > 1 : false;
  const batchWordErrorRate = batches ? Math.floor(batches.reduce((batchWordErrorRate, batch) => batchWordErrorRate + (batch?.batchWordErrorRate ?? 0), 0) / numBenchmark) : null;
  const aggregateStats = batches ? [
    {
      totalTime: totalTime ? totalTime.toString() : EMPTY_COL_PLACEHOLDER,
      totalFiles: numFiles ? numFiles.toString() : EMPTY_COL_PLACEHOLDER,
      batchWordErrorRate: batchWordErrorRate && !allNonBenchmark && !allNonBWER ? `${isAvgBWER ? 'avg' : ''} ${batchWordErrorRate.toString()}%` : EMPTY_COL_PLACEHOLDER,
    }
  ] : [];
  const aggregateStatisticsRows = createTableRows(aggregateStats, (row) => [row.totalTime, row.totalFiles, row.batchWordErrorRate])

  // Routing decision.
  const distributionData = content?.distributionData ?? [];

  // Files table.
  const fileTableData = content?.fileTableData ?? [];
  const tableRows = createTableRows(fileTableData,
    (row) => [
      row.fileName,
      getFormattedStorageSize(row.bytes),
      getFormattedRepresentation(row.processingTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      getFormattedRepresentation(row.classificationTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      getFormattedRepresentation(row.routingTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      getFormattedRepresentation(row.totalTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      row.prediction.toString(),
      (row.fileWordErrorRate * 100).toFixed(0) + '%',
      row.subtaskModel
    ])

  return (
    <div className="text-sm">
      {/* LAS Branding. */}
      <div className="flex w-full items-center space-x-2 p-2">
        <Image src="/LASLogoHome.png" alt="LAS Logo" width={50} height={50} />
        <p>North Carolina State University | LAS Department</p>
      </div>

      <main className="flex flex-col w-full divide-y divide-y-gray-200">
        {/* Title section.*/}
        <section className="flex flex-col space-y-1 text-center p-2">
          <h1 className="text-2xl font-bold">SYSTEM REPORT</h1>
          <p className="text-xl">{APP_FULL_NAME}</p>
          <p className="text-md text-gray-600">{todaysDate}</p>
          <p className="text-sm">Generated by v{APP_VERSION} System.</p>
        </section>

        {/* Meta section. */}
        <section className="text-sm text-gray-800 p-2">
          <p><strong>Report ID:</strong> {hash}</p>
          <p><strong>Generated at:</strong> {generatedAt} UTC</p>
          <p><strong>Report period:</strong> {reportPeriod}</p>
          <p><strong>Data Source:</strong> {REPORTS_DATA_SOURCE}</p>
        </section>

        {/* TOC section.*/}
        {/* <section className="flex flex-col space-y-2 p-2">
          <h2 className="text-lg font-semibold mb-2">Table of Contents</h2>
          <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-800">
            {
              toc.map(({title, href}, index) => (
                <li key={index}>
                  <a href={href}>{title}</a>
                </li>
              ))
            }
          </ol>
        </section> */}

        {/* Batches Reporting. */}
        <section id={toc[0].href} className="flex flex-col space-y-2 p-2">
          <h2 className="text-lg font-semibold mb-2">Batches Reporting</h2>
          <Table
            headers={batchHeaders}
            rows={batchTableRows}
          />
        </section>

        {/* Aggregate Statistics. */}
        <section id={toc[1].href} className="flex flex-col space-y-2 p-2">
          <h2 className="text-lg font-semibold mb-2">Aggregate Statistics</h2>
          <Table
            headers={aggregateStatisticsHeaders}
            rows={aggregateStatisticsRows}
          />
        </section>

        {/* Routing Decision. */}
        <section id={toc[2].href} className="flex flex-col space-y-2 p-2 w-full">
          <h2 className="text-lg font-semibold mb-2">Routing Decision</h2>
          <div className="flex w-full">
            <SankeyChart data={createSankeyChartData(
              distributionData,
              (d) => `Files: Subtask ${d.prediction} (WER = X)`,
              (d) => d.routedCount,
              'Total',
              distributionData[0]?.routedTotal
            )}
            />
          </div>
        </section>

        {/* Files. */}
        <section id={toc[3].href} className="flex flex-col space-y-2 p-2">
          <h2 className="text-lg font-semibold mb-2">Files</h2>
          <Table
            headers={tableHeaders}
            rows={tableRows}
            displayColumns={tableOptions?.colNames}
            indexCols={true}
          />
        </section>

      </main>
    </div>
  )
}

export default PDFReportClient;