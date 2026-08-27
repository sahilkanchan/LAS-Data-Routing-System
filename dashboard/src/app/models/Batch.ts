
export interface BatchInterface {
  batchID: number
  uuid: string
  numFiles: number
  benchmark: boolean
  batchWordErrorRate: number | null
  totalTime: number
  created_at: Date
}

export class Batch implements BatchInterface {
  batchID: number
  uuid: string
  numFiles: number
  benchmark: boolean
  batchWordErrorRate: number | null
  totalTime: number
  created_at: Date

  constructor({
    batchID,
    uuid,
    numFiles,
    benchmark,
    batchWordErrorRate,
    totalTime,
    created_at
  }: BatchInterface) {
    this.batchID = batchID
    this.uuid = uuid;
    this.numFiles = numFiles;
    this.benchmark = benchmark;
    this.batchWordErrorRate = batchWordErrorRate;
    this.totalTime = totalTime;
    this.created_at = created_at;
  }

  // static getFormattedDate(pattern: string, date: Date): string {
  //   const formatted = dayjs(date).format(pattern)
  //   return formatted
  // }
}
