'use client';

import Link from "next/link";

import { useState, useEffect } from "react";
import clsx from 'clsx'

import DividerSection from "@/app/components/reusable/DividerSection";
import Panel from "@/app/components/reusable/Panel";
import ComplexTable from "@/app/components/reusable/ComplexTable";
import ComplexDropdown from "@/app/components/reusable/ComplexDropdown";

import { createComplexTableRows } from "@/app/lib/components/complextable";

import { FunnelIcon, ArrowsUpDownIcon, ViewColumnsIcon, BookOpenIcon, StarIcon } from "@heroicons/react/24/outline";

import { getTableAnalytics, OverviewAnalytics, Paginator } from "@/app/actions/overview";
import { useBatchStore } from "@/app/store/batchStore";
import { useTableStore } from "@/app/store/tableStore";

import { Nullable } from "@/app/types/main";
import { createComplexDropdownOptions, SelectedOptionProp, ComplexDropdownOption } from "@/app/lib/components/complexdropdown";
import { getFormattedRepresentation, getFormattedStorageSize, MS_IN_SEC } from "@/app/lib/common";

// Custom Components.
const TranscriptButton = ({ url }: { url: string }) => {
  return (
    <div className="flex w-full justify-center items-center">
      <Link href={url} target="_blank" rel="noreferrer" className="p-1 hover:bg-gray-200 active:bg-gray-300 rounded-md">
        <BookOpenIcon className="w-5 h-5"/>
      </Link>
    </div>
  )
}
const GroundTruthButton = ({ url }: { url: string }) => {
  return (
    <div className="flex w-full justify-center items-center">
      <Link href={url} target="_blank" rel="noreferrer" className="p-1 hover:bg-gray-200 active:bg-gray-300 rounded-md">
        <StarIcon className="w-5 h-5"/>
      </Link>
    </div>
  )
}
const AudioButton = ({ url }: { url: string }) => {
  return (
    <div className="flex w-full justify-center items-center">
      <audio controls>
        <source src={url} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}

const ColumnSelectedLabel = ({ selected }: SelectedOptionProp<string>) => {
  const selectedBatchStr = selected.length === columnOptions.length ? 'All' : selected[0].label + (selected.length > 1 ? ` (+${selected.length - 1})` : '')

  return (
    <span className="flex items-center space-x-1">
      <ViewColumnsIcon className="h-4 w-4" />
      <p>{selectedBatchStr}</p>
    </span>
  )
}

const SortSelectedLabel = ({ selected }: SelectedOptionProp<string>) => {
  return (
    <span className="flex items-center space-x-1">
      <ArrowsUpDownIcon className="h-4 w-4" />
      <p>{selected[0].label}</p>
    </span>
  )
}

const FilterSelectedLabel = ({ selected }: SelectedOptionProp<string>) => {
  return (
    <span className="flex items-center space-x-1">
      <FunnelIcon className="h-4 w-4" />
      <p>{selected[0].label}</p>
    </span>
  )
}

// Helper functions.
function buildTableRows(paginator: Nullable<Paginator>) {
  if (!paginator) return []
  const tableRows = createComplexTableRows(paginator.analytics,
    (row, key) => [
      row.fileName,
      getFormattedStorageSize(row.bytes),
      getFormattedRepresentation(row.processingTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      getFormattedRepresentation(row.classificationTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      getFormattedRepresentation(row.routingTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      getFormattedRepresentation(row.totalTime, MS_IN_SEC, (num, dec) => `${num !== 0 ? num + 's ' : ''}${dec}ms`),
      row.prediction.toString(),
      (row.fileWordErrorRate * 100).toFixed(0) + '%',
      row.subtaskModel,
      <TranscriptButton key={`transcript-link-${key}`} url={row.transcriptionUrl} />,
      <GroundTruthButton key={`ground-truth-link-${key}`} url={row.groundTruthUrl} />,
      <AudioButton key={`audio-link-${key}`} url={row.audioUrl} />,
    ])
  return tableRows
}

// const EMPTY_COL_PLACEHOLDER = '---'
const tableHeaders = ['Filename', 'Size', 'Processing Time', 'Classification Time', 'Routing Time', 'Total Time', 'Prediction', 'WER', 'Subtask Model', 'Transcript', 'Ground Truth', 'Audio']

const columnOptions = createComplexDropdownOptions(tableHeaders, (option) => option)

const sortLabels = ['Filename', 'Total Time', 'WER']
const sortOptions = createComplexDropdownOptions(sortLabels, (option) => option)

const filterLabels = ['None', 'Correct', 'Incorrect']
const filterOptions = createComplexDropdownOptions(filterLabels, (option) => option)

interface MasterTableProps {
  analytics: Nullable<OverviewAnalytics>
}

const MasterTable = ({ analytics }: MasterTableProps) => {
  const paginator = analytics?.paginator ?? null
  const paginatorStep = paginator?.step ?? 1
  const initTableRows = buildTableRows(paginator)

  useEffect(() => {
    const updatedTableRows = buildTableRows(paginator)
    setTableRows(updatedTableRows)
    refreshPagination(paginator)
  }, [paginator])

  const { selectedBatch } = useBatchStore()
  const { setVisibleColumnsStore, setSortByStore, setFilterByStore } = useTableStore()

  // Table state.
  const [tableRows, setTableRows] = useState(initTableRows)
  const [sortBy, setSortBy] = useState([sortOptions[0]])
  const [filterBy, setFilterBy] = useState([filterOptions[0]])
  const [columnsVisible, setColumnsVisible] = useState(columnOptions) // default: all columns.

  // Pagination state.
  const [currEntry, setCurrEntry] = useState(paginator?.current ?? 1)
  const [totalEntries, setTotalEntries] = useState(paginator?.total ?? 0)
  const [hasNextPage, setHasNextPage] = useState(paginator?.hasNext ?? false)
  const [hasPrevPage, setHasPrevPage] = useState(paginator?.hasPrev ?? false)

  function refreshPagination(paginator: Nullable<Paginator>) {
    setTotalEntries(paginator?.total ?? 0)
    setHasNextPage(paginator?.hasNext ?? false)
    setHasPrevPage(paginator?.hasPrev ?? false)
    setCurrEntry(paginator?.current ?? 1)
  }

  function fetchTableAnalytics(
    batchUuids: string[],
    orderBy: Nullable<string> = null,
    filterBy: Nullable<string> = null,
    entry: number = 1
  ) {
    getTableAnalytics(batchUuids, orderBy, filterBy, entry)
      .then(res => {
        const tableRows = buildTableRows(res)
        setTableRows(tableRows)
        refreshPagination(res)
      })
      .catch(err => console.error(err))
  }

  function onSortChangeHandler(option: ComplexDropdownOption<string>[]) {
    setSortBy(option) // update state.
    setSortByStore(option[0].data) // update table store.
    fetchTableAnalytics(selectedBatch.map((batch) => batch.uuid), option[0].data, filterBy[0].data, currEntry)
  }

  function onFilterChangeHandler(option: ComplexDropdownOption<string>[]) {
    setFilterBy(option) // update state.
    setFilterByStore(option[0].data) // update table store.
    fetchTableAnalytics(selectedBatch.map((batch) => batch.uuid), sortBy[0].data, option[0].data, currEntry)
  }

  function onColumnsChangeHandler(option: ComplexDropdownOption<string>[]) {
    if (option.length === 0) return; // guard against empty selected.

    setColumnsVisible(option) // update state.
    setVisibleColumnsStore(option.map((opt) => opt.data)) // update table store.
  }

  function nextPageHandler() {
    if (!hasNextPage) return;
    fetchTableAnalytics(selectedBatch.map((batch) => batch.uuid), sortBy[0].data, filterBy[0].data, currEntry + paginatorStep)
  }

  function prevPageHandler() {
    if (!hasPrevPage) return;
    fetchTableAnalytics(selectedBatch.map((batch) => batch.uuid), sortBy[0].data, filterBy[0].data, currEntry - paginatorStep)
  }

  return (
    <>
      <DividerSection
        sectionTitle="Batch"
      >
        <div className="flex flex-col space-y-2">
          <Panel>
            <div className="flex items-center w-full p-1 justify-between">
              <div>
                <ComplexDropdown
                  optionsAnchor="bottom start"
                  multiSelect={true}
                  options={columnOptions}
                  selected={columnsVisible}
                  selectedLabel={ColumnSelectedLabel}
                  onChange={onColumnsChangeHandler}
                />
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <ComplexDropdown
                  options={filterOptions}
                  selected={filterBy}
                  selectedLabel={FilterSelectedLabel}
                  onChange={onFilterChangeHandler}
                />
                <ComplexDropdown
                  options={sortOptions}
                  selected={sortBy}
                  selectedLabel={SortSelectedLabel}
                  onChange={onSortChangeHandler}
                />
              </div>
            </div>

            <ComplexTable
              headers={tableHeaders}
              rows={tableRows}
              displayColumns={columnsVisible.map((col) => col.data)}
            />

            {/* Table pagination */}
            <div className="flex w-full items-center justify-between p-2 text-sm">
              <span className="text-gray-600">
                {`${currEntry} to ${(currEntry + paginatorStep - 1) <= totalEntries ? currEntry + paginatorStep - 1 : totalEntries} of ${totalEntries} entries`}
              </span>
              <span className="flex items-center space-x-1">
                <button
                  className={clsx(
                    "flex items-center px-2 py-1 rounded-md",
                    hasPrevPage ? 'text-gray-600 hover:bg-gray-200 active:bg-gray-300' : 'text-gray-400 cursor-not-allowed'
                  )}
                  disabled={!hasPrevPage}
                  onClick={prevPageHandler}
                >
                  <span>Previous</span>
                </button>
                <button
                  className={clsx(
                    "flex items-center px-2 py-1 rounded-md",
                    hasNextPage ? 'text-gray-600 hover:bg-gray-200 active:bg-gray-300' : 'text-gray-400 cursor-not-allowed'
                  )}
                  disabled={!hasNextPage}
                  onClick={nextPageHandler}
                >
                  <span>Next</span>
                </button>
              </span>
            </div>
          </Panel>
        </div>
      </DividerSection>
    </>
  )
}

export default MasterTable;