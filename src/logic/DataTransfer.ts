export interface Entry {
  type: string
  asString: () => Promise<string>
}

export const extractEntries = ({ items }: DataTransfer) =>
  ([...items] as DataTransferItem[]).map(item => ({
    type: item.type,
    asString: () => extractAsString(item),
  }))

export const extractAsString = (item: DataTransferItem): Promise<string> => {
  return new Promise((resolve, reject) => {
    switch (item.kind) {
      case "string":
        return item.getAsString(resolve)

      case "file": {
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
      }
    }
  })
}
