export interface InputProcessorInterface {
  fileID: number
  batchID: number
  fileName: string
  bytes: number
  processingTime: number
  isValid: boolean
  shape: string // tuple format.
  uuid: string
}

export class InputProcessor implements InputProcessorInterface {
  fileID: number
  batchID: number
  fileName: string
  bytes: number
  processingTime: number
  isValid: boolean
  shape: string // tuple format.
  uuid: string

  constructor({
    fileID,
    batchID,
    fileName,
    bytes,
    processingTime,
    isValid,
    shape, // tuple format.
    uuid,
  }: InputProcessor) {
    this.fileID = fileID
    this.batchID = batchID
    this.fileName = fileName
    this.bytes = bytes
    this.processingTime = processingTime
    this.isValid = isValid
    this.shape = shape
    this.uuid = uuid
  }
}
