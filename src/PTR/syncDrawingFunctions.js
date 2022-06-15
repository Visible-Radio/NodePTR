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
    }
    if (word.word.flags.wipeScreenFlag) {
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

function getCharAbsoluteScreenLayout({ charObj, state }) {
  const {
    rowsScrolled,
    config: { scale, charWidth, borderThickness, gridSpaceX, gridSpaceY },
  } = state;
  return charObj
    .frameState()
    .reduce((acc, { row: charPointY, col: charPointX }) => {
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
      return [...acc, { pxX, pxY, pxSizeX, pxSizeY }];
    }, []);
}

function absoluteLayoutWidthTxFn({ pts, targetWidth, state }) {
  // take an array of points ready to be drawn to the canvas
  // map them to a grid of the desired with
  return pts.reduce((acc, pt) => {
    const transformed = ptWidthTxFn({ pt, targetWidth, state });
    if (
      transformed.pxX <= state.config.scale ||
      transformed.pxY >= state.ctx.canvas.height - state.config.borderThickness
    )
      return acc;

    return [...acc, transformed];
  }, []);
}

function ptWidthTxFn({ pt, targetWidth, state }) {
  const linearIndex = pt.pxX + pt.pxY * state.ctx.canvas.width;
  const { col: pxX, row: pxY } = gridPositionFromIndex({
    index: linearIndex,
    columns: targetWidth,
  });
  return { ...pt, pxX, pxY };
}

function gridPositionFromIndex({ index, columns }) {
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

function drawWipeScreen({ word, state }) {
  const onScreenChars = getOnScreenChars({ word, state });
  const absoluteScreenLayout = onScreenChars.reduce((acc, charObj) => {
    return [...acc, ...getCharAbsoluteScreenLayout({ charObj, state })];
  }, []);

  const layouts = makeWipeScreenLayouts({
    initLayout: absoluteScreenLayout,
    state,
  });
  const {
    ctx,
    config: { borderStroke, borderThickness },
  } = state;

  state.config.snapshot({
    frameDuration: 500,
  });

  layouts.forEach((layout, i) => {
    ctx.clearRect(
      borderStroke,
      borderStroke,
      ctx.canvas.width - borderThickness,
      ctx.canvas.height - borderThickness,
    );
    layout.forEach(({ pxX, pxY, pxSizeX, pxSizeY }) => {
      state.ctx.fillStyle = state.getColor();
      state.ctx.fillRect(pxX, pxY, pxSizeX, pxSizeY);
    });
    state.config.snapshot({
      frameDuration: 40,
    });
  });
  ctx.clearRect(
    borderStroke,
    borderStroke,
    ctx.canvas.width - borderThickness,
    ctx.canvas.height - borderThickness,
  );
  state.config.snapshot({
    frameDuration: 1000,
  });
  //
  const lastChar = word.chars.slice(-1)[0];
  const screenRowIndex =
    state.config.displayRows + state.rowsScrolled() - lastChar.row;
  state.setRowsScrolled(
    state.rowsScrolled() + state.config.displayRows - (screenRowIndex - 1),
  ); // subtract from display rows the row that the flag occured on
}

function makeWipeScreenLayouts({ initLayout, state }) {
  let layouts = [];
  for (let i = state.ctx.canvas.width; i > 0; i -= state.config.scale) {
    const layout = absoluteLayoutWidthTxFn({
      pts: initLayout,
      targetWidth: i,
      state,
    });
    if (layout.length === 0) continue;
    layouts.push(layout);
  }

  // should add frame duration to each layout
  return [
    ...layouts.slice(0, 6),
    ...repeatLayouts([layouts[0], layouts[1]], 10),
    ...repeatLayouts(layouts.slice(0, 5), 10),
  ];
}

function repeatLayouts(layouts, times, acc = []) {
  if (times === 0) return acc;
  return repeatLayouts(layouts, times - 1, [...acc, ...layouts]);
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
