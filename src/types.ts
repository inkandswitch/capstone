export interface Card {
  id: string
  x: number
  y: number
  z: number
  isBeingDraggedFromArchive: boolean
  onBoard: boolean
  text?: string
  image?: string
}
