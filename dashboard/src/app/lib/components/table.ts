import { NonNullableObj } from "@/app/types/main"

export interface TableRow {
  columns: string[]
}

type ColumnLambda<D> = (data: D) => string[]

export function createTableRows<D extends NonNullableObj>(
  rows: D[],
  columns: ColumnLambda<D>
): TableRow[] {
  return rows.map((row) => {
    return { columns: columns(row) }
  })
}