import * as test from "tape"
import * as Link from "../Link"

test("Link.format", t => {
  t.equal(
    Link.format({
      type: "Text",
      id: "id1",
    }),
    "capstone://Text/id1/8Fs",
    "Returns formatted URL",
  )

  t.end()
})

test("Link.parts", t => {
  t.deepEqual(
    Link.parts("scheme://foo/bar/baz"),
    {
      nonCrc: "scheme://foo/bar",
      scheme: "scheme",
      type: "foo",
      id: "bar",
      crc: "baz",
    },
    "Returns URL parts for invalid URLs",
  )

  t.end()
})

test("Link.parse", t => {
  t.deepEqual(
    Link.parse("capstone://Text/id1/8Fs"),
    {
      url: "capstone://Text/id1/8Fs",
      nonCrc: "capstone://Text/id1",
      scheme: "capstone",
      type: "Text",
      id: "id1",
      crc: "8Fs",
    },
    "Returns URL parts",
  )

  t.throws(() => {
    Link.parse("")
  }, "Throws on empty string")

  t.throws(() => {
    Link.parse("abc123")
  }, "Throws on random string")

  t.throws(() => {
    Link.parse("capstone://Text/id1")
  }, "Throws on missing CRC")

  t.throws(() => {
    Link.parse("capstone://Text/id1/8F")
  }, "Throws on invalid CRC")

  t.end()
})
