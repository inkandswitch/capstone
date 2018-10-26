import * as DataTransfer from "../logic/DataTransfer"
import { once, isUndefined, first } from "lodash"
import Content from "./Content"
import { AnyEditDoc, ChangeFn } from "automerge/frontend"
import { isMatch } from "micromatch"
import * as Link from "../data/Link"

type ImporterWithGlob = [string, Function]

const importers: ImporterWithGlob[] = [
  [
    "text/plain+capstone",
    async (item: DataTransferItem) => await DataTransfer.extractAsText(item),
  ],
  [
    "image/*",
    async (item: DataTransferItem) =>
      addImage(await DataTransfer.extractAsDataURL(item)),
  ],
  [
    "text/csv",
    async (item: DataTransferItem) =>
      addTable(await DataTransfer.extractAsText(item)),
  ],
  [
    "text/plain",
    async (item: DataTransferItem) =>
      addText(await DataTransfer.extractAsText(item)),
  ],
  [
    "text/plain",
    async (item: DataTransferItem) =>
      addText(await DataTransfer.extractAsText(item)),
  ],
]

export const importData = (data: DataTransfer): Promise<string>[] => {
  return DataTransfer.extractEntries(data)
    .map(entry => {
      // Find first matching importer from array of importers, supporting globbing
      const importerTypeIdx = importers.findIndex(([importerGlob, _]) =>
        isMatch(entry.type, importerGlob),
      )

      return importerTypeIdx >= 0
        ? importers[importerTypeIdx][1](entry.item)
        : undefined
    })
    .filter(_ => _ !== undefined)
}

export const addText = async (content: string) => {
  if (Link.isValidLink(content)) {
    return content // the URL is already what we want!
  }

  return addDoc("Text", doc => {
    doc.content = content.split("")
  })
}

export const addTable = async (content: string) => {
  return addDoc("Table", doc => {
    const header = content.split("\n")[0].split(",")

    // [ "col1", "col2", ... ]
    doc.header = header

    // [
    //   { col1: val1, col2: val2 }
    //   ...
    // ]
    doc.content = content
      .split("\n")
      .slice(1)
      .map(line =>
        line
          .split(",")
          .reduce(
            (memo, value, idx) => ({ ...memo, [header[idx]]: value }),
            {},
          ),
      )
  })
}

export const addImage = (src: string) => {
  return addDoc("Image", doc => {
    doc.src = src
  })
}

export const addDoc = async (type: string, changeFn: ChangeFn<unknown>) => {
  const url = Content.create(type)

  Content.open(url)
    .change(changeFn)
    .close()

  return url
}
