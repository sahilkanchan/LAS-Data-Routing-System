'use client';

import DividerSection from "../reusable/DividerSection";
import Panel from "@/app/components/reusable/Panel";

import { OverviewAnalytics } from "@/app/actions/overview";

import { Nullable } from "@/app/types/main";

import { getFormattedRepresentation } from "@/app/lib/common";

const EMPTY_COL_PLACEHOLDER = '---'

interface AggregateBoardProps {
  analytics: Nullable<OverviewAnalytics>
}

const AggregateBoard = ({ analytics }: AggregateBoardProps) => {
  const batches = analytics ? analytics.batches : null;
  const totalTime = batches ? getFormattedRepresentation(batches.reduce((totalTime, batch) => totalTime + batch.totalTime, 0), 1000, (num, dec) => `${num}s ${dec}ms`) : null;
  const numFiles = batches ? batches.reduce((numFiles, batch) => numFiles + batch.numFiles, 0) : null;

  const allNonBenchmark = batches ? batches.every((batch) => !batch.benchmark) : false;
  const allNonBWER = batches ? batches.every((batch) => !batch.batchWordErrorRate) : false;
  const numBenchmark = batches ? batches.filter((batch) => batch?.benchmark).length : 1;
  const isAvgBWER = batches ? numBenchmark > 1 : false;
  const batchWordErrorRate = batches ? Math.floor(batches.reduce((batchWordErrorRate, batch) => batchWordErrorRate + (batch?.batchWordErrorRate ?? 0), 0) / numBenchmark) : null;

  return (
    <>
      <DividerSection
        sectionTitle='Aggregate' // should also display the # of selected batches.
      >
        <Panel>
          <div className="grid grid-cols-3 w-full h-30">
            <div className="flex w-full justify-center">
              <div className="text-center">
                <h3 className="font-bold">Total Time</h3>
                <p className="text-4xl p-3">{totalTime ? totalTime.toString() : EMPTY_COL_PLACEHOLDER}</p>
              </div>
            </div>
            <div className="flex w-full justify-center">
              <div className="text-center">
                <h3 className="font-bold">Total Files</h3>
                <p className="text-4xl p-3">{numFiles ? numFiles.toString() : EMPTY_COL_PLACEHOLDER}</p>
              </div>
            </div>
            <div className="flex w-full justify-center">
              <div className="text-center">
                <h3 className="font-bold">Word Error Rate</h3>
                <p className="text-4xl p-3">{batchWordErrorRate && !allNonBenchmark && !allNonBWER ? `${isAvgBWER ? 'avg' : ''} ${batchWordErrorRate.toString()}%` : EMPTY_COL_PLACEHOLDER}</p>
              </div>
            </div>
          </div>
        </Panel>
      </DividerSection>
    </>
  )
}

export default AggregateBoard;