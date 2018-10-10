import * as DataTransfer from "../logic/DataTransfer"
import { once, isUndefined, first } from "lodash"
import Content from "./Content"
import { AnyEditDoc, ChangeFn } from "automerge/frontend"

const importers: { [k: string]: Function } = {
  image: async (item: DataTransferItem) =>
    addImage(await DataTransfer.extractAsDataURL(item)),
  text: async (item: DataTransferItem) =>
    addText(await DataTransfer.extractAsText(item)),
}

export const importData = (data: DataTransfer): Promise<string>[] => {
  return DataTransfer.extractEntries(data)
    .filter(entry => {
      const typePrefix = first(entry.type.split("/"))
      return typePrefix && typePrefix in importers
    })
    .map(entry => {
      const typePrefix: string = first(entry.type.split("/"))!
      return importers[typePrefix](entry.item)
    })
}

export const addText = async (content: string) => {
  return addDoc("Text", doc => {
    doc.content = content.split("")
    return doc
  })
}

export const addImage = async (src: string) => {
  return addDoc("Image", doc => {
    doc.src = src
    return doc
  })
}

export const addDoc = async (type: string, changeFn: ChangeFn<unknown>) => {
  const url = await Content.create(type)

  const onOpen = (doc: AnyEditDoc) => {
    change(changeFn)
  }

  const change = Content.open(url, once(onOpen))
  return url
}
