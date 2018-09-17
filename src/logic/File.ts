export type ResultType = "DataURL" | "Text" | "ArrayBuffer"

export function read(as: "DataURL", file: File): Promise<string>
export function read(as: "Text", file: File): Promise<string>
export function read(as: "ArrayBuffer", file: File): Promise<ArrayBuffer>
export async function read(as: ResultType, file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    switch (as) {
      case "DataURL":
        reader.readAsDataURL(file)
        break
      case "Text":
        reader.readAsText(file)
        break
      case "ArrayBuffer":
        reader.readAsArrayBuffer(file)
        break
    }

    reader.onload = () => {
      const { result } = reader
      if (result) resolve(result)
    }

    reader.onerror = () => {
      reject(reader.error)
    }
  })
}
