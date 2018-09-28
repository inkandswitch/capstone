export enum Glyph {
  unknown = 0,
  copy,
  paste,
  delete,
  create,
  edit,
}

export function fromTemplateName(originalName: string): Glyph {
  switch (originalName) {
    case "x-left":
    case "x-right":
    case "x-top":
    case "x-bottom":
      return Glyph.delete
    case "caret":
      return Glyph.copy
    case "v":
      return Glyph.paste
    case "rectangle":
      return Glyph.create
    case "circle":
      return Glyph.edit
  }
  return Glyph.unknown
}
