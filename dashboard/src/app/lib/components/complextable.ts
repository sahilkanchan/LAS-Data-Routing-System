import React from "react"

export interface ComplexTableRow {
  columns: (React.ReactElement | string)[] // html element or plain string.
}

// idx needed for key.
type ColumnLambda<D> = (data: D, idx: number) => (React.ReactElement | string)[]

export function createComplexTableRows<D>(
  rows: D[],
  columns: ColumnLambda<D>
): ComplexTableRow[] {
  return rows.map((row, idx) => {
    return { columns: columns(row, idx) }
  })
}