'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ComplexDropdown from "@/app/components/reusable/ComplexDropdown";

import { createComplexDropdownOptions, SelectedOptionProp, ComplexDropdownOption } from "@/app/lib/components/complexdropdown";
import { getFormattedDate } from "@/app/lib/common";
import { BatchInterface } from "@/app/models/Batch";

import { useBatchStore } from "@/app/store/batchStore";
import { useTableStore } from "@/app/store/tableStore";
import { getSafeUuids } from "@/app/lib/common";

import { ArrowUpOnSquareIcon, FlagIcon } from "@heroicons/react/24/outline";

interface BatchOptionProps {
  option: BatchInterface
}

const BatchOption = ({ option }: BatchOptionProps) => {
  const isBenchmark = !!option.benchmark
  const timestampStr = getFormattedDate('MM/DD/YY hh:mm:ss', option.created_at)

  return (
    <span className="flex items-center space-x-1 text-sm">
      <span>{timestampStr}</span>
      <span className="pl-1">
        { isBenchmark ? <FlagIcon className="w-3 h-3 fill-green-400" /> : '' }
      </span>
    </span>
  )
}

const SelectedBatchComponent = ({ selected }: SelectedOptionProp<BatchInterface>) => {
  const selectedBatchStr = getFormattedDate('MM/DD/YY hh:mm:ss', selected[0].data.created_at) + (selected.length > 1 ? ` (+${selected.length - 1})` : '')

  return (
    <span className="flex items-center space-x-1">
      {selectedBatchStr}
    </span>
  )
}

interface NavbarRightProps {
  batches: BatchInterface[];
}

const NavbarRight = ({ batches }: NavbarRightProps) => {
  // Extract url params for init dropdown state.
  const queryParams = useSearchParams();
  const batchUuidsSet = queryParams.get('b') ? new Set(getSafeUuids(queryParams.get('b'))) : null;

  // Init dropdown options, selected.
  const options = createComplexDropdownOptions(batches, (option) => <BatchOption option={option}/>)
  const [selected, setSelected] = useState(batchUuidsSet ? options.filter(({ data }) => batchUuidsSet.has(data.uuid)) : [options[0]])

  const { setBatches, setSelectedBatch, getSelectedBatchCommaSeparated } = useBatchStore();
  const { getVisibleColumnsCommaSeparated, visibleColumnsStore, filterByStore, sortByStore } = useTableStore();

  // Download report.
  const downloadApiUrl = `/api/generate-report/pdf-report?b=${getSelectedBatchCommaSeparated()}${visibleColumnsStore ? `&c=${getVisibleColumnsCommaSeparated()}` : ''}${filterByStore ? `&f=${filterByStore}` : ''}${sortByStore ? `&s=${sortByStore}` : ''}`;

  useEffect(() => {
    // CAREFUL with stuff like this!
    // was original outside of (on first load) and caused extreme app slowdown due to rerendering.
    setBatches(batches)
    setSelectedBatch([batches[0]])
  }, [setBatches, setSelectedBatch, batches])

  function dropdownHandler(option: ComplexDropdownOption<BatchInterface>[]) {
    if (option.length === 0) return; // guard against empty selected.

    setSelected(option)
    setSelectedBatch(option.map((opt) => opt.data as BatchInterface))
  }

  return (
    <>
      <div className="flex w-full items-center justify-end p-2">
        <div className="flex items-center space-x-2">
          <Link href={downloadApiUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 active:bg-gray-300 rounded-md">
            <ArrowUpOnSquareIcon className="w-5 h-5" />
          </Link>

          <ComplexDropdown
            multiSelect={true}
            options={options}
            selected={selected}
            selectedLabel={SelectedBatchComponent}
            onChange={dropdownHandler}
          />

          {/* <button className="p-2 hover:bg-gray-200 active:bg-gray-300 text-green-500 rounded-md">
            <PlayIcon className="w-5 h-5"/>
          </button> */}
        </div>
      </div>
    </>
  )
}

export default NavbarRight;