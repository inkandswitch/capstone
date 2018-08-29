import * as test from "tape"
import * as $P from "../"

const rec = new $P.Recognizer()

test("$P.AddGesture", t => {
  t.doesNotThrow(() => {
    rec.AddGesture("box", [
      pt(0, 0, 0),
      pt(0, 1, 0),
      pt(1, 1, 0),
      pt(1, 0, 0),
      pt(0, 0, 0),
    ])
  }, "adds a box")

  t.doesNotThrow(() => {
    rec.AddGesture("X", [
      pt(30, 146, 1),
      pt(106, 222, 1),
      pt(30, 225, 2),
      pt(106, 146, 2),
    ])
  }, "adds an X")

  t.end()
})

test("$P.Recognize exact match", t => {
  const result = rec.Recognize([
    pt(0, 0, 0),
    pt(0, 1, 0),
    pt(1, 1, 0),
    pt(1, 0, 0),
    pt(0, 0, 0),
  ])

  t.equal(result.Name, "box", "matches box")
  t.equal(result.Score, 0, "score is 0")

  t.end()
})

test("$P.Recognize scaled match", t => {
  const result = rec.Recognize([
    pt(3, 3, 0),
    pt(3, 10, 0),
    pt(10, 10, 0),
    pt(10, 3, 0),
    pt(3, 3, 0),
  ])

  t.equal(result.Name, "box", "matches large box")
  t.ok(near(result.Score, 0), "score is near 0")

  t.end()
})

test("$P.Recognize too few points", t => {
  const result = rec.Recognize([pt(3, 3, 0)])

  t.equal(result.Score, -1, "score is -1")

  t.end()
})

test("$P.Recognize poor match", t => {
  const result = rec.Recognize([pt(3, 3, 0), pt(10, 3, 0)])

  t.ok(result.Score > 9, "score is greater than 9")

  t.end()
})

const pt = (x: number, y: number, strokeId: number = 0) =>
  new $P.Point(x, y, strokeId)

const near = (actual: number, expected: number) =>
  Math.abs(actual - expected) < 1e-10
