/**
 * The $1 Unistroke Recognizer (JavaScript version)
 *
 *  Jacob O. Wobbrock, Ph.D.
 *  The Information School
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  wobbrock@uw.edu
 *
 *  Andrew D. Wilson, Ph.D.
 *  Microsoft Research
 *  One Microsoft Way
 *  Redmond, WA 98052
 *  awilson@microsoft.com
 *
 *  Yang Li, Ph.D.
 *  Department of Computer Science and Engineering
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  yangli@cs.washington.edu
 *
 * The academic publication for the $1 recognizer, and what should be
 * used to cite it, is:
 *
 *  Wobbrock, J.O., Wilson, A.D. and Li, Y. (2007). Gestures without
 *     libraries, toolkits or training: A $1 recognizer for user interface
 *     prototypes. Proceedings of the ACM Symposium on User Interface
 *     Software and Technology (UIST '07). Newport, Rhode Island (October
 *     7-10, 2007). New York: ACM Press, pp. 159-168.
 *
 * The Protractor enhancement was separately published by Yang Li and programmed
 * here by Jacob O. Wobbrock:
 *
 *  Li, Y. (2010). Protractor: A fast and accurate gesture
 *    recognizer. Proceedings of the ACM Conference on Human
 *    Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *    (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved. Last updated July 14, 2018.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
 * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/
//
// Point class
//
export function Point(
  x,
  y, // constructor
) {
  this.X = x
  this.Y = y
}

//
// Unistroke class: a unistroke template
//
export function Unistroke(
  name,
  points, // constructor
) {
  this.Name = name
  this.Points = points
}

//
// DollarRecognizer class
//
export function DollarRecognizer() {
  // constructor
  //
  // one built-in unistroke per gesture type
  //
  this.Unistrokes = new Array()
  this.Unistrokes[0] = new Unistroke(
    "x",
    new Array(
      new Point(87, 142),
      new Point(89, 145),
      new Point(91, 148),
      new Point(93, 151),
      new Point(96, 155),
      new Point(98, 157),
      new Point(100, 160),
      new Point(102, 162),
      new Point(106, 167),
      new Point(108, 169),
      new Point(110, 171),
      new Point(115, 177),
      new Point(119, 183),
      new Point(123, 189),
      new Point(127, 193),
      new Point(129, 196),
      new Point(133, 200),
      new Point(137, 206),
      new Point(140, 209),
      new Point(143, 212),
      new Point(146, 215),
      new Point(151, 220),
      new Point(153, 222),
      new Point(155, 223),
      new Point(157, 225),
      new Point(158, 223),
      new Point(157, 218),
      new Point(155, 211),
      new Point(154, 208),
      new Point(152, 200),
      new Point(150, 189),
      new Point(148, 179),
      new Point(147, 170),
      new Point(147, 158),
      new Point(147, 148),
      new Point(147, 141),
      new Point(147, 136),
      new Point(144, 135),
      new Point(142, 137),
      new Point(140, 139),
      new Point(135, 145),
      new Point(131, 152),
      new Point(124, 163),
      new Point(116, 177),
      new Point(108, 191),
      new Point(100, 206),
      new Point(94, 217),
      new Point(91, 222),
      new Point(89, 225),
      new Point(87, 226),
      new Point(87, 224),
    ),
  )
  this.Unistrokes[1] = new Unistroke(
    "rectangle",
    new Array(
      new Point(78, 149),
      new Point(78, 153),
      new Point(78, 157),
      new Point(78, 160),
      new Point(79, 162),
      new Point(79, 164),
      new Point(79, 167),
      new Point(79, 169),
      new Point(79, 173),
      new Point(79, 178),
      new Point(79, 183),
      new Point(80, 189),
      new Point(80, 193),
      new Point(80, 198),
      new Point(80, 202),
      new Point(81, 208),
      new Point(81, 210),
      new Point(81, 216),
      new Point(82, 222),
      new Point(82, 224),
      new Point(82, 227),
      new Point(83, 229),
      new Point(83, 231),
      new Point(85, 230),
      new Point(88, 232),
      new Point(90, 233),
      new Point(92, 232),
      new Point(94, 233),
      new Point(99, 232),
      new Point(102, 233),
      new Point(106, 233),
      new Point(109, 234),
      new Point(117, 235),
      new Point(123, 236),
      new Point(126, 236),
      new Point(135, 237),
      new Point(142, 238),
      new Point(145, 238),
      new Point(152, 238),
      new Point(154, 239),
      new Point(165, 238),
      new Point(174, 237),
      new Point(179, 236),
      new Point(186, 235),
      new Point(191, 235),
      new Point(195, 233),
      new Point(197, 233),
      new Point(200, 233),
      new Point(201, 235),
      new Point(201, 233),
      new Point(199, 231),
      new Point(198, 226),
      new Point(198, 220),
      new Point(196, 207),
      new Point(195, 195),
      new Point(195, 181),
      new Point(195, 173),
      new Point(195, 163),
      new Point(194, 155),
      new Point(192, 145),
      new Point(192, 143),
      new Point(192, 138),
      new Point(191, 135),
      new Point(191, 133),
      new Point(191, 130),
      new Point(190, 128),
      new Point(188, 129),
      new Point(186, 129),
      new Point(181, 132),
      new Point(173, 131),
      new Point(162, 131),
      new Point(151, 132),
      new Point(149, 132),
      new Point(138, 132),
      new Point(136, 132),
      new Point(122, 131),
      new Point(120, 131),
      new Point(109, 130),
      new Point(107, 130),
      new Point(90, 132),
      new Point(81, 133),
      new Point(76, 133),
    ),
  )
  this.Unistrokes[2] = new Unistroke(
    "caret",
    new Array(
      new Point(79, 245),
      new Point(79, 242),
      new Point(79, 239),
      new Point(80, 237),
      new Point(80, 234),
      new Point(81, 232),
      new Point(82, 230),
      new Point(84, 224),
      new Point(86, 220),
      new Point(86, 218),
      new Point(87, 216),
      new Point(88, 213),
      new Point(90, 207),
      new Point(91, 202),
      new Point(92, 200),
      new Point(93, 194),
      new Point(94, 192),
      new Point(96, 189),
      new Point(97, 186),
      new Point(100, 179),
      new Point(102, 173),
      new Point(105, 165),
      new Point(107, 160),
      new Point(109, 158),
      new Point(112, 151),
      new Point(115, 144),
      new Point(117, 139),
      new Point(119, 136),
      new Point(119, 134),
      new Point(120, 132),
      new Point(121, 129),
      new Point(122, 127),
      new Point(124, 125),
      new Point(126, 124),
      new Point(129, 125),
      new Point(131, 127),
      new Point(132, 130),
      new Point(136, 139),
      new Point(141, 154),
      new Point(145, 166),
      new Point(151, 182),
      new Point(156, 193),
      new Point(157, 196),
      new Point(161, 209),
      new Point(162, 211),
      new Point(167, 223),
      new Point(169, 229),
      new Point(170, 231),
      new Point(173, 237),
      new Point(176, 242),
      new Point(177, 244),
      new Point(179, 250),
      new Point(181, 255),
      new Point(182, 257),
    ),
  )
  this.Unistrokes[3] = new Unistroke(
    "v",
    new Array(
      new Point(89, 164),
      new Point(90, 162),
      new Point(92, 162),
      new Point(94, 164),
      new Point(95, 166),
      new Point(96, 169),
      new Point(97, 171),
      new Point(99, 175),
      new Point(101, 178),
      new Point(103, 182),
      new Point(106, 189),
      new Point(108, 194),
      new Point(111, 199),
      new Point(114, 204),
      new Point(117, 209),
      new Point(119, 214),
      new Point(122, 218),
      new Point(124, 222),
      new Point(126, 225),
      new Point(128, 228),
      new Point(130, 229),
      new Point(133, 233),
      new Point(134, 236),
      new Point(136, 239),
      new Point(138, 240),
      new Point(139, 242),
      new Point(140, 244),
      new Point(142, 242),
      new Point(142, 240),
      new Point(142, 237),
      new Point(143, 235),
      new Point(143, 233),
      new Point(145, 229),
      new Point(146, 226),
      new Point(148, 217),
      new Point(149, 208),
      new Point(149, 205),
      new Point(151, 196),
      new Point(151, 193),
      new Point(153, 182),
      new Point(155, 172),
      new Point(157, 165),
      new Point(159, 160),
      new Point(162, 155),
      new Point(164, 150),
      new Point(165, 148),
      new Point(166, 146),
    ),
  )
  this.Unistrokes[4] = new Unistroke(
    "delete",
    new Array(
      new Point(123, 129),
      new Point(123, 131),
      new Point(124, 133),
      new Point(125, 136),
      new Point(127, 140),
      new Point(129, 142),
      new Point(133, 148),
      new Point(137, 154),
      new Point(143, 158),
      new Point(145, 161),
      new Point(148, 164),
      new Point(153, 170),
      new Point(158, 176),
      new Point(160, 178),
      new Point(164, 183),
      new Point(168, 188),
      new Point(171, 191),
      new Point(175, 196),
      new Point(178, 200),
      new Point(180, 202),
      new Point(181, 205),
      new Point(184, 208),
      new Point(186, 210),
      new Point(187, 213),
      new Point(188, 215),
      new Point(186, 212),
      new Point(183, 211),
      new Point(177, 208),
      new Point(169, 206),
      new Point(162, 205),
      new Point(154, 207),
      new Point(145, 209),
      new Point(137, 210),
      new Point(129, 214),
      new Point(122, 217),
      new Point(118, 218),
      new Point(111, 221),
      new Point(109, 222),
      new Point(110, 219),
      new Point(112, 217),
      new Point(118, 209),
      new Point(120, 207),
      new Point(128, 196),
      new Point(135, 187),
      new Point(138, 183),
      new Point(148, 167),
      new Point(157, 153),
      new Point(163, 145),
      new Point(165, 142),
      new Point(172, 133),
      new Point(177, 127),
      new Point(179, 127),
      new Point(180, 125),
    ),
  )
  this.Unistrokes[5] = new Unistroke(
    "circle",
    new Array(
      new Point(127, 141),
      new Point(124, 140),
      new Point(120, 139),
      new Point(118, 139),
      new Point(116, 139),
      new Point(111, 140),
      new Point(109, 141),
      new Point(104, 144),
      new Point(100, 147),
      new Point(96, 152),
      new Point(93, 157),
      new Point(90, 163),
      new Point(87, 169),
      new Point(85, 175),
      new Point(83, 181),
      new Point(82, 190),
      new Point(82, 195),
      new Point(83, 200),
      new Point(84, 205),
      new Point(88, 213),
      new Point(91, 216),
      new Point(96, 219),
      new Point(103, 222),
      new Point(108, 224),
      new Point(111, 224),
      new Point(120, 224),
      new Point(133, 223),
      new Point(142, 222),
      new Point(152, 218),
      new Point(160, 214),
      new Point(167, 210),
      new Point(173, 204),
      new Point(178, 198),
      new Point(179, 196),
      new Point(182, 188),
      new Point(182, 177),
      new Point(178, 167),
      new Point(170, 150),
      new Point(163, 138),
      new Point(152, 130),
      new Point(143, 129),
      new Point(140, 131),
      new Point(129, 136),
      new Point(126, 139),
    ),
  )

  this.AddGesture = function(name, points) {
    this.Unistrokes[this.Unistrokes.length] = new Unistroke(name, points) // append new unistroke
    var num = 0
    for (var i = 0; i < this.Unistrokes.length; i++) {
      if (this.Unistrokes[i].Name == name) num++
    }
    return num
  }
  this.DeleteUserGestures = function() {
    this.Unistrokes.length = NumUnistrokes // clear any beyond the original set
    return NumUnistrokes
  }

  this.RotateBy = function(
    points,
    radians, // rotates points around centroid
  ) {
    var c = this.Centroid(points)
    var cos = Math.cos(radians)
    var sin = Math.sin(radians)
    var newpoints = new Array()
    for (var i = 0; i < points.length; i++) {
      var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
      var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y
      newpoints[newpoints.length] = new Point(qx, qy)
    }
    return newpoints
  }

  this.Centroid = function(points) {
    var x = 0.0,
      y = 0.0
    for (var i = 0; i < points.length; i++) {
      x += points[i].X
      y += points[i].Y
    }
    x /= points.length
    y /= points.length
    return new Point(x, y)
  }
}
