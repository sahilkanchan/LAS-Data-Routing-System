'use client';

import { TableRow } from "@/app/lib/components/table";

interface TableProps {
  headers: string[];
  rows: TableRow[];
  displayColumns?: string[] | null;
  headersStyling?: string;
  rowsStyling?: string;
  indexCols?: boolean
}

const Table = ({headers, rows, displayColumns, headersStyling, rowsStyling, indexCols = false}: TableProps) => {
  const displayHeaders = indexCols ? [' ', ...headers] : headers;
  const displayColumnsIndex = displayColumns ? [' ', ...displayColumns].map((col) => {
    const index = displayHeaders.indexOf(col)
    if (index !== -1) return index
    return null
  }).filter((col) => col !== null) : null

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className={headersStyling && headersStyling.length > 0 ? headersStyling : 'bg-gray-200'}>
            {
              displayHeaders.map((header, idx) => !displayColumns || (displayColumns && displayColumnsIndex?.includes(idx)) ? <th key={idx} className="px-4 py-2 border-b text-left">{header}</th> : '')
            }
          </tr>
        </thead>
        <tbody>
          {
            rows.map((row, idx) => {
              const displayCols = indexCols
              ? [(idx + 1).toString(), ...row.columns]
              : row.columns;
              return (
                <tr key={idx} className={rowsStyling && rowsStyling.length > 0 ? rowsStyling : 'bg-white'}>
                  {
                    displayCols.map((col, idx) => !displayColumns || (displayColumns && displayColumnsIndex?.includes(idx)) ? <td key={idx} className="px-4 py-2 border-b">{col}</td> : '')
                  }
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}

export default Table;