// SQL query helpers

export function sqlWhereIn(col: string, arr: string[]) {
  return `WHERE ${col} IN (${arr.map((item) => `'${item}'`).join(',')})`
}

// translates provided sort value to column name in db.
export function mapSortToDBValue(column: string) {
  switch (column) {
    case 'Filename':
      return 'fileName'
    case 'Total Time':
      return '(processingTime + classificationTime + routingTime)'
    case 'WER':
      return 'fileWordErrorRate'
    default:
      return 'fileName'
  }
}

// translates provided filter value to column name in db.
export function mapFilterToStatement(prepend: string,column: string) {
  switch (column) {
    case 'Correct':
      return prepend + 'fileWordErrorRate = 0'
    case 'Incorrect':
      return prepend + 'fileWordErrorRate != 0'
    default:
      return ''
  }
}