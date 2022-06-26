import fs from 'fs';
import readline from 'readline';
import GIFEncoder from 'gifencoder';
import canvasExport from 'canvas';
import { syncDrawWords } from './syncDrawingFunctions.js';
import {
  setupCanvas,
  makeWords,
  makeStateSync,
  modifyDefs,
  drawBorder,
  calculateTotalFrames,
} from './commonFunctions.js';

import {
  defaultText,
  defaultColumns,
  defaultRows,
  defaultScale,
} from './constants.js';

import defs from './CHARDEFS/customDefs_charWidth_7.js';

const { createCanvas } = canvasExport;

export const nptr = (fileName, { text, columns, displayRows, scale }) =>
  run(
    fileName,
    prepareModel({
      text: text ?? defaultText,
      columns: columns || defaultColumns,
      displayRows: displayRows || defaultRows,
      scale: scale || defaultScale,
      defs,
    }),
    GIFEncoderFrameCapture,
  );

export function GIFEncoderFrameCapture(ctx, frameMetrics, fileName) {
  console.log('Frame Summary');
  console.dir(frameMetrics, { depth: null });
  const encoder = initGIFEncoder(ctx, fileName);
  let frameSnapShotCounter = 0;
  return [
    (payload, ctx) => {
      encoder.setDelay(payload?.last ? 1000 : payload?.frameDuration ?? 20);
      try {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(
          `Recording frame ${frameSnapShotCounter} of ${frameMetrics.totalFrames}`,
        );
        encoder.addFrame(ctx);

        frameSnapShotCounter++;
      } catch (error) {
        console.log(error);
        process.exit(1);
      }
    },
    () => {
      const doneMessage = `\nDone! Wrote ${frameSnapShotCounter} frames`;
      process.stdout.write(doneMessage);
      encoder.finish();
    },
  ];
}

export function initGIFEncoder(ctx, fileName) {
  const encoder = new GIFEncoder(ctx.canvas.width, ctx.canvas.height);
  encoder.createReadStream().pipe(fs.createWriteStream(`${fileName}.gif`));
  encoder.start();
  encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
  encoder.setDelay(20); // frame delay in ms
  encoder.setQuality(5);
  return encoder;
}

export function run(fileName, state, initFn) {
  const { ctx } = state;
  const frameMetrics = calculateTotalFrames(state);
  const [snapshotFn, onCompleteFn] = initFn(ctx, frameMetrics, fileName);
  state.config.snapshot = payload => snapshotFn(payload, ctx);
  drawBorder(state);
  syncDrawWords({
    state,
  });
  onCompleteFn();
}

export function prepareModel({ columns, scale, text, defs, displayRows }) {
  const modifiedDefs = modifyDefs(defs);
  const { charWidth } = modifiedDefs;
  const { words, charCount } = makeWords(text, columns, modifiedDefs);
  const totalRows = words.slice(-1)[0].row + 1;
  const { ctx, config } = setupCanvas({
    canvas: createCanvas(),
    totalRows,
    columns,
    scale,
    charWidth,
    gridSpaceX: 0,
    gridSpaceY: scale,
    displayRows,
    charCount,
  });
  const state = makeStateSync({ ctx, words, config });
  return state;
}
