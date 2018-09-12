export interface Entry {
  type: string
  asString: () => Promise<string>
}

export const extractEntries = ({ files, items }: DataTransfer) => {
  const kind = files.length > 0 ? "file" : "string"

  return ([...items] as DataTransferItem[])
    .filter(item => item.kind === kind)
    .map(item => ({
      type: item.type,
      asString: () => extractAsString(item),
    }))
}

export const extractAsString = (item: DataTransferItem): Promise<string> => {
  if (item.kind === "file") {
    return extractAsDataURL(item)
  }

  return new Promise(resolve => item.getAsString(resolve))
}

const extractAsDataURL = (item: DataTransferItem): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    const file = item.getAsFile()
    if (!file) return Promise.reject(new Error("Not a file"))

    if (item.type === "text/plain") {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }

    reader.onload = () => {
      const { result } = reader
      if (result) resolve()
    }
    reader.onerror = () => {
      reject(reader.error)
    }
  })
