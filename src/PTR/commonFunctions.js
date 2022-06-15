const { drawScrollWords } = require('./asyncDrawingFunctions.js');
const { getFlags } = require('./getFlags.js');
const { drawScrollWordsSync } = require('./syncDrawingFunctions.js');

function breakWord(word, columns, broken = []) {
  // recursively break down a word that is too long
  if (word.length <= columns) {
    return [...broken, word];
  } else {
    return [
      ...broken,
      word.slice(0, columns),
      ...breakWord(word.slice(columns, word.length), columns, broken),
    ];
  }
}

function parseWords(text, columns) {
  return text.split(/(\s|\n)/).reduce((acc, w) => {
    const [trimmed, flags] = getFlags(w);
    if (!trimmed.length) return acc;
    const totalSegments = Math.ceil(trimmed.length / columns);
    const segments =
      totalSegments > 1 ? breakWord(trimmed, columns) : [trimmed];
    return [...acc, { fullWordText: trimmed, totalSegments, segments, flags }];
  }, []);
}

function makeWords(text, columns, defs) {
  // break the string into words, none of which are longer than the number of columns
  const parsedWords = parseWords(text.toUpperCase(), columns);

  // assign each word a row and column value
  return parsedWords.reduce(
    (acc, word) => {
      word.segments.forEach((segment, segmentIndex) => {
        function bundleWord() {
          return {
            word,
            segment,
            segmentIndex,
            row: acc.row,
            col: acc.col,
            chars: makeChars({
              incrementCharCount: acc.incrementCharCount.bind(acc),
              segment,
              segmentIndex,
              word,
              row: acc.row,
              col: acc.col,
              defs,
            }),
          };
        }

        if (/[\n\s]/.test(segment)) {
          if (segment === '\n') {
            acc.words.push(bundleWord());
            acc.col = 0;
            acc.row += 1;
          }
          return acc;
        }

        if (acc.getRemaining() >= segment.length) {
          acc.words.push(bundleWord());
          acc.col += segment.length + 1;
          // +1 is to add a space
        } else {
          acc.row += 1;
          acc.col = 0;
          acc.words.push(bundleWord());
          acc.col += segment.length + 1;
        }
      });
      return acc;
    },
    {
      words: [],
      row: 0,
      col: 0,
      charCount: 0,
      getRemaining() {
        return columns - this.col;
      },
      incrementCharCount() {
        this.charCount++;
      },
    },
  );
}

function makeChars({
  segment,
  segmentIndex,
  word,
  row,
  col,
  defs,

  incrementCharCount,
}) {
  return segment.split('').map((c, i) => {
    let frameNum = 0;
    if (c !== '\n') {
      // call incrementCharCount() conditionally
      // tokens like '\n' appear here so they can trigger scrolling when encountered by the drawing functions
      // but they themselves do not have any frames
      incrementCharCount();
    }
    return {
      char: c,
      row,
      col: col + i,
      def: defs[c] ?? defs[' '],
      charWidth: defs.charWidth,
      flags: word.flags,
      segmentIndex,

      index() {
        // provide a the index to the segment on the associated word
        return segmentIndex();
      },
      word() {
        // provide a reference to the associated word
        return word;
      },
      frameNum() {
        return frameNum;
      },
      frameState() {
        return getFrameState(frameNum, this);
      },
      nextFrame() {
        if (frameNum < this.charWidth) {
          const frame = getFrameState(frameNum, this);
          frameNum += 1;
          return frame;
        } else if (frameNum === this.charWidth) {
          frameNum = 0;
          return getFrameState(frameNum, this);
        }
      },
      setFrameNum(val) {
        frameNum = val;
      },
      applyScrollTransform(scrollFrameIndex, state) {
        // every Y value in every char should be decremented by charWidth
        // thereby moving that point up one display grid unit (not column)
        return applyScrollTransformToDef({
          scrollFrameIndex,
          charObj: this,
          state,
        });
      },
    };
  });
}

// this works on the def array - what if we wrote a function that works on x,y points
function applyHighlightTransform(def, charObj) {
  if (!charObj.flags.highlightFlag) return def;
  const { charWidth } = charObj;
  let full = [];
  for (let i = 0; i < charWidth * charWidth; i++) {
    if (!def.includes(i)) full.push(i);
  }
  return full;
}

function applyScrollTransformToDef({ scrollFrameIndex, charObj, state }) {
  const { gridSpaceY, scale } = state.config;
  const newDef = applyHighlightTransform(charObj.def, charObj).map(point => {
    const scrolledPoint =
      point - charObj.charWidth * (scrollFrameIndex + (gridSpaceY / scale - 1));
    return gridPositionFromIndex({
      index: scrolledPoint,
      columns: charObj.charWidth,
      char: charObj.char,
    });
  });
  return newDef;
}

function gridPositionFromIndex({ index, columns, char }) {
  if (index >= 0) {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return {
      col,
      row,
    };
  }
  if (index < 0) {
    const row = Math.floor(index / columns);
    const col =
      index % columns === 0 ? index % columns : (index % columns) + columns;

    return {
      col,
      row,
    };
  }
}

function getFrameState(frameNum, charObj) {
  // based one the frame num, apply a transformation to the def
  // and return it as a new array
  // this will be what gets drawn to the canvas for that character frame
  const { charWidth, def } = charObj;
  const lastFrame = charWidth === frameNum + 1;

  const totalPoints = charWidth * (frameNum + 1);

  const points = applyHighlightTransform(
    def.slice(0, totalPoints),
    charObj,
  ).reduce((acc, point) => {
    const newPoint = gridPositionFromIndex({
      index: point,
      columns: frameNum + 1,
    });

    if (lastFrame) {
      if (newPoint.row < charWidth + 1 && newPoint.row > -2) {
        return [...acc, newPoint];
      }
    }
    if (newPoint.row < charWidth && newPoint.row > -2) {
      return [...acc, newPoint];
    }

    return acc;
  }, []);
  return points;
}

function makeStateAsync({ words, ctx, config }) {
  let borderColor = [200, 0, 120];
  let color = [0, 190, 187];
  let rowsScrolled = 0;
  function rgbToString(rgbArr) {
    const [r, g, b] = rgbArr;
    return `rgb(${r},${g},${b})`;
  }

  const state = {
    ctx,
    words,
    config,
    color,
    getColor() {
      return rgbToString(color);
    },
    getBorderColor() {
      return rgbToString(borderColor);
    },
    newColor() {
      return generateRandomColors();
    },
    rowsScrolled() {
      return rowsScrolled;
    },
    async scroll({ charObj }) {
      // grab all the words with rows < charObj.row
      // we'll need to re-draw these
      const scrollTheseWords = words.filter(word => word.row < charObj.row);
      await drawScrollWords({ state: { ...this, words: scrollTheseWords } });
      rowsScrolled += 1;
    },
  };
  return state;
}
function makeStateSync({ words, ctx, config }) {
  let borderColor = [200, 0, 120];
  let color = [0, 190, 187];
  let rowsScrolled = 0;
  function rgbToString(rgbArr) {
    const [r, g, b] = rgbArr;
    return `rgb(${r},${g},${b})`;
  }

  const state = {
    ctx,
    words,
    config,
    color,
    getColor() {
      return rgbToString(color);
    },
    getBorderColor() {
      return rgbToString(borderColor);
    },
    setColor(rgbArr) {
      color = rgbArr;
      return rgbToString(color);
    },
    dimColor() {
      color = color.map(channel => channel / 2);
      return rgbToString(color);
    },
    brightenColor(factor = 2) {
      color = color.map(channel => channel * factor);
      return rgbToString(color);
    },
    newColor() {
      return generateRandomColors();
    },
    rowsScrolled() {
      return rowsScrolled;
    },
    setRowsScrolled(val) {
      rowsScrolled = val;
    },
    scroll({ charObj }) {
      // grab all the words with rows < charObj.row
      // we'll need to re-draw these
      const scrollTheseWords = words.filter(word => word.row < charObj.row);
      drawScrollWordsSync({ state: { ...this, words: scrollTheseWords } });
      rowsScrolled += 1;
    },
  };
  return state;
}

function generateRandomColors() {
  const random = () => {
    const num = Math.floor(Math.random() * (350 - 50) + 50);
    return num > 255 ? 255 : num;
  };
  const R = random();
  const G = random();
  const B = random();
  const color = `rgb(${R}, ${G}, ${B})`;
  return color;
}

function setupCanvas({
  canvas,
  totalRows,
  columns,
  scale,
  charWidth,
  gridSpaceX,
  gridSpaceY,
  displayRows,
  charCount,
}) {
  // set up the canvas
  if (canvas === null || canvas === undefined) {
    throw new Error("couldn't get canvas element");
  }
  const ctx = canvas.getContext('2d');
  // we need to alot for space between rows and columns when sizing the canvas
  // we'll draw a border around the canvas elsehwere
  // so also include space for this
  const borderThickness = scale * 3;
  const borderSpace = borderThickness * 2;
  const borderStroke = scale;
  const displayWidth = columns * scale * charWidth;
  const displayHeight = displayRows * scale * charWidth;

  ctx.canvas.width = displayWidth + (columns - 1) * gridSpaceX + borderSpace;
  ctx.canvas.height =
    displayRows * scale * charWidth +
    (displayRows - 1) * gridSpaceY +
    borderSpace;

  return {
    ctx,
    config: {
      totalRows,
      columns,
      displayRows,
      displayWidth,
      displayHeight,
      scale,
      charWidth,
      gridSpaceX,
      gridSpaceY,
      borderThickness,
      borderSpace,
      borderStroke,
      charCount,
    },
  };
}

function makeCanvas() {
  const root = document.getElementById('root');
  const canvas = document.createElement('canvas');
  canvas.style.margin = '3px';
  root.appendChild(canvas);
  return canvas;
}

function drawBorder(state) {
  const { ctx } = state;
  const borderStroke = state.config.borderStroke;
  ctx.strokeStyle = state.getBorderColor();

  ctx.moveTo(borderStroke / 2, borderStroke / 2);
  ctx.lineTo(ctx.canvas.width - borderStroke / 2, borderStroke / 2);
  ctx.lineTo(
    ctx.canvas.width - borderStroke / 2,
    ctx.canvas.height - borderStroke / 2,
  );
  ctx.lineTo(borderStroke / 2, ctx.canvas.height - borderStroke / 2);
  ctx.lineTo(borderStroke / 2, 0);
  ctx.lineWidth = borderStroke;
  ctx.stroke();
}

function modifyDefs(defs) {
  return Object.fromEntries(
    Object.entries(defs).map(([key, value]) => {
      if (key === 'charWidth') {
        return [key, value + 2];
      } else {
        // remap the points as though they belong in a grid 2 columns wider
        // this guarantees that in order to 'highlight' any char, we can simply invert that cell
        // since we have a border in which no square contains part of the character
        return [
          key,
          value.map((pointIndex, i) => {
            // for each row in the new grid, add 1 to the point Indexes in that row
            return (pointIndex +=
              2 * Math.floor(pointIndex / defs.charWidth) +
              1 +
              defs.charWidth +
              2);
          }),
        ];
      }
    }),
  );
}

function calculateTotalFrames(state) {
  const {
    totalRows,
    displayRows,
    charWidth,
    charCount: numberOfChars,
  } = state.config;
  const numberOfScrollEvents =
    totalRows - displayRows > -1 ? totalRows - displayRows : 0;
  const numberOfScrollFrames = (charWidth + 2) * numberOfScrollEvents;
  const numberOfCharFrames = charWidth * numberOfChars;
  return {
    totalRows,
    displayRows,
    numberOfScrollEvents,
    numberOfScrollFrames,
    numberOfCharFrames,
    numberOfChars,
    totalFrames: numberOfScrollFrames + numberOfCharFrames + 1,
  };
}

module.exports = {
  drawBorder,
  modifyDefs,
  calculateTotalFrames,
  makeCanvas,
  setupCanvas,
  makeStateAsync,
  makeStateSync,
  makeWords,
  makeChars,
  gridPositionFromIndex,
  applyScrollTransformToDef,
  applyHighlightTransform,
  getFrameState,
};
