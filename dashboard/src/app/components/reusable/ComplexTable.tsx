'use client';

import { ComplexTableRow } from "@/app/lib/components/complextable";

interface TableProps {
  headers: string[],
  rows: ComplexTableRow[]
  displayColumns?: string[]
  emptyMsg?: string
}

const Table = ({headers, rows, displayColumns, emptyMsg}: TableProps) => {
  // validate rows and headers.
  //if (displayColumns && headers.length !== rows[0]?.columns.length) throw new Error('Headers and rows must have the same length.')

  const displayColumnsIndex = displayColumns ? displayColumns.map((col) => {
    const index = headers.indexOf(col)
    if (index !== -1) return index
  }) : null

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            {
              headers.map((header, idx) => !displayColumns || (displayColumns && displayColumns.includes(header)) ? <th key={idx} className="px-4 py-2 border-b">{header}</th> : '')
            }
          </tr>
        </thead>
        <tbody>
          {
            rows.map((row, idx) => {
              return (
                <tr key={idx} className="bg-white">
                  {
                    row.columns.map((col, idx) => !displayColumns || (displayColumns && displayColumnsIndex?.includes(idx)) ? <td key={idx} className="px-4 py-2 border-b">{col}</td> : '')
                  }
                </tr>
              )
            })
          }
        </tbody>
      </table>
      { rows.length === 0 ? <div className="flex w-full items-center justify-center p-5 text-gray-600">{emptyMsg ?? 'No Results.'}</div> : '' }
    </div>
  )
}

export default Table;