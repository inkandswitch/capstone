import * as File from "./File"

export interface Entry {
  item: DataTransferItem
  type: string
  getAsText: () => Promise<string>
  getAsDataURL: () => Promise<string>
}

export const createFromMap = (data: {
  [format: string]: string
}): DataTransfer => {
  const dataTransfer = new DataTransfer()

  for (const k in data) {
    dataTransfer.setData(k, data[k])
  }

  return dataTransfer
}

export const extractEntries = ({ files, items }: DataTransfer): Entry[] => {
  const kind = files.length > 0 ? "file" : "string"

  // We only want to extract "string" items if there are no "file" items,
  // so we filter based on `item.kind`.
  return ([...items] as DataTransferItem[])
    .filter(item => item.kind === kind)
    .map(item => ({
      item: item,
      type: item.type,
      getAsText: () => extractAsText(item),
      getAsDataURL: () => extractAsDataURL(item),
    }))
}

export const extractAsText = (item: DataTransferItem): Promise<string> => {
  const file = item.getAsFile()

  if (file) {
    return File.read("Text", file)
  } else {
    return new Promise(resolve => item.getAsString(resolve))
  }
}

export const extractAsDataURL = (item: DataTransferItem): Promise<string> => {
  const file = item.getAsFile()

  if (file) {
    return File.read("DataURL", file)
  } else {
    // TODO: read non-files as data URLs
    return Promise.reject(new Error("Not a file"))
  }
}
