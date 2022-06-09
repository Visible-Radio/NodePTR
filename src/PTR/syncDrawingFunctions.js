function clearFrame({ charPoints, charObj, state }) {
  const {
    ctx,
    config: { scale, charWidth, gridSpaceX, gridSpaceY, borderThickness },
    rowsScrolled,
  } = state;
  charPoints.forEach(({ row: charPointY, col: charPointX }) => {
    const rowGap = (charObj.row - rowsScrolled()) * gridSpaceY;
    const colGap = charObj.col * gridSpaceX;
    const pxX =
      charObj.col * scale * charWidth +
      charPointX * scale +
      colGap +
      borderThickness;
    const pxY =
      (charObj.row - rowsScrolled()) * scale * charWidth +
      charPointY * scale +
      rowGap +
      borderThickness;
    const pxSizeX = scale;
    const pxSizeY = scale;
    ctx.clearRect(pxX, pxY, pxSizeX, pxSizeY);
  });
}

function syncDrawWords({ state }) {
  const { words } = state;
  for (let word of words) {
    drawWord({ word, state });
    if (word.word.flags.blinkFlag) {
      drawBlinkWord({ word, state });
    } else if (word.word.flags.wipeScreenFlag) {
      drawWipeScreen({ word, state });
    }
  }
  state.config.snapshot({ last: true });
}

function getOnScreenWords({ word, state }) {
  const lastChar = word.chars.slice(-1)[0];
  const screenRowIndex =
    state.config.displayRows + state.rowsScrolled() - lastChar.row;
  const firstOnScreenRowIndex =
    lastChar.row - (state.config.displayRows - screenRowIndex);
  const { onScreenWords } = state.words.reduce(
    (acc, w) => {
      if (w.row >= firstOnScreenRowIndex && !acc.done) {
        return {
          ...acc,
          onScreenWords: [...acc.onScreenWords, w],
          done: w.word === lastChar.word(),
        };
      }
      return acc;
    },
    { onScreenWords: [], done: false },
  );
  return onScreenWords;
}

function getOnScreenChars({ word, state }) {
  return getOnScreenWords({ word, state }).reduce((acc, w) => {
    return [...acc, ...w.chars];
  }, []);
}

function charsToDisplayLayoutTxFn({ charPoints, charObj, state }) {
  //  recall charPoints is an array of {col: num, row: num}
  //  where each item describes a single point inside the char's own square
  //  These are NOT individual points on the canvas
  // additional calculations are done to determine this, considering among other things
  //  the char's own row/column
  // That's what this meat does:
  // const {
  //   rowsScrolled,
  //   config: { scale, charWidth, gridSpaceX, gridSpaceY, borderThickness },
  // } = state;
  // charPoints.forEach(({ row: charPointY, col: charPointX }) => {
  //   const rowGap = (charObj.row - rowsScrolled()) * gridSpaceY;
  //   const colGap = charObj.col * gridSpaceX;
  //   const pxY =
  //     (charObj.row - rowsScrolled()) * scale * charWidth +
  //     charPointY * scale +
  //     rowGap +
  //     borderThickness;
  //   if ([0, scale].includes(pxY)) return;
  //   const pxX =
  //     charObj.col * scale * charWidth +
  //     charPointX * scale +
  //     colGap +
  //     borderThickness;
  //   const pxSizeX = scale;
  //   const pxSizeY = scale;
  // });
}

function drawWipeScreen({ word, state }) {
  const onScreenChars = getOnScreenChars({ word, state });
  console.log(onScreenChars);

  console.log(onScreenChars.map(charObj => charObj.frameState()));
}

function drawBlinkWord({ word, state, times = 6 }) {
  // clear, then draw the word several times
  let blinkCounter = 0;
  while (blinkCounter < times) {
    state.dimColor();
    word.chars.forEach(char =>
      drawFrameSync({ charPoints: char.frameState(), charObj: char, state }),
    );
    state.config.snapshot({ frameDuration: 30 });

    word.chars.forEach(char =>
      clearFrame({ charPoints: char.frameState(), charObj: char, state }),
    );
    state.config.snapshot({ frameDuration: 200 });

    state.brightenColor(4);
    word.chars.forEach(char =>
      drawFrameSync({ charPoints: char.frameState(), charObj: char, state }),
    );
    state.config.snapshot({ frameDuration: 30 });

    state.dimColor();
    word.chars.forEach(char =>
      drawFrameSync({ charPoints: char.frameState(), charObj: char, state }),
    );
    state.config.snapshot({ frameDuration: 200 });
    blinkCounter++;
  }
}

function drawWord({ word, state }) {
  for (let charObj of word.chars) {
    if (charObj.word().fullWordText === '\n') {
      if (charObj.row === state.config.displayRows + state.rowsScrolled()) {
        //
        state.scroll({ charObj });
      }
    } else {
      drawEachCharFrame({ charObj, state });
    }
  }
}

function drawEachCharFrame({ charObj, state }) {
  const { config } = state;

  if (charObj.row === config.displayRows + state.rowsScrolled()) {
    //
    state.scroll({ charObj });
  }
  let last;
  while (charObj.frameNum() < charObj.charWidth) {
    const charPoints = charObj.nextFrame();

    if (last) {
      //
      clearFrame({ charPoints: last, charObj, state });
    }
    drawFrameSync({ charPoints, charObj, state });
    config.snapshot();
    last = charPoints;
  }
  charObj.setFrameNum(config.charWidth - 1);
}

//
function drawFrameSync({ charPoints, charObj, state }) {
  const {
    ctx,
    rowsScrolled,
    config: { scale, charWidth, gridSpaceX, gridSpaceY, borderThickness },
  } = state;
  charPoints.forEach(({ row: charPointY, col: charPointX }) => {
    const rowGap = (charObj.row - rowsScrolled()) * gridSpaceY;
    const colGap = charObj.col * gridSpaceX;
    const pxY =
      (charObj.row - rowsScrolled()) * scale * charWidth +
      charPointY * scale +
      rowGap +
      borderThickness;
    if ([0, scale].includes(pxY)) return;
    const pxX =
      charObj.col * scale * charWidth +
      charPointX * scale +
      colGap +
      borderThickness;
    const pxSizeX = scale;
    const pxSizeY = scale;

    ctx.fillStyle = state.getColor();
    ctx.fillRect(pxX, pxY, pxSizeX, pxSizeY);
  });
}

function drawScrollWordsSync({ state }) {
  const {
    ctx,
    config: { borderStroke, borderThickness },
  } = state;
  let scrollFrameIndex = 0;
  while (scrollFrameIndex < state.config.charWidth + 2) {
    ctx.clearRect(
      borderStroke,
      borderStroke,
      ctx.canvas.width - borderThickness,
      ctx.canvas.height - borderThickness,
    );
    drawScrollFrameSync({ state, scrollFrameIndex });
    state.config.snapshot();
    scrollFrameIndex++;
  }
}

function drawScrollFrameSync({ state, scrollFrameIndex }) {
  const { words } = state;
  for (let word of words) {
    for (let charObj of word.chars) {
      // to do it's job, it needs values from state.config - namely gridSpace and scale
      const charPoints = charObj.applyScrollTransform(scrollFrameIndex, state);
      drawFrameSync({ charPoints, charObj, state });
    }
  }
}

module.exports = {
  syncDrawWords,
  drawFrameSync,
  clearFrame,
  drawScrollWordsSync,
  drawScrollFrameSync,
};
