// import { random, range, keyBy } from "lodash/fp"
// const count = 50
// const imageProb = 0.2

// export const cards = keyBy("id", range(0, count).map(card))

// function card(i): Types.Card {
//   const isImage = Math.random() < imageProb

//   return {
//     id: `c${i}`,
//     x: random(0, 1000),
//     y: random(0, 800),
//     z: i,
//     type: isImage ? "Image" : "Text",
//     doc: isImage ? image() : text(),
//   }
// }

// function image(): Types.Image {
//   return {
//     src: images[random(1, images.length) - 1],
//   }
// }

// function text(): Types.Text {
//   return {
//     content: texts[random(1, texts.length) - 1].split(""),
//   }
// }
