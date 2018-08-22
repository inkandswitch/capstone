import * as Link from "./Link"

export default {
  id0: {
    boardUrl: Link.format({ type: "Board", id: "id1" }),
    archiveUrl: Link.format({ type: "Archive", id: "id4" }),
  },
  id1: {
    topZ: 0,
    cards: [
      // { x: 450, y: 50, z: 0, url: Link.format({ type: "Image", id: "id2" }) },
      // { x: 50, y: 70, z: 0, url: Link.format({ type: "Image", id: "id2" }) },
      // { x: 50, y: 50, z: 0, url: Link.format({ type: "Text", id: "id3" }) },
      // { x: 450, y: 450, z: 0, url: Link.format({ type: "Text", id: "id3" }) },
    ],
  },
  id2: {
    src: "./assets/leonardo_anatomy.jpg",
  },
  id3: {
    content:
      "This Misconception around his flying machines and other fantastical devices most likely designed for theather performances, not the real world",
  },
  id4: {
    docs: [
      { url: Link.format({ type: "Board", id: "id1" }) },
      { url: Link.format({ type: "Image", id: "id2" }) },
      { url: Link.format({ type: "Text", id: "id3" }) },
    ],
  },
}
