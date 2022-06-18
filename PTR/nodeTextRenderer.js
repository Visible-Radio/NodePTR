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

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const defs = require('./CHARDEFS/customDefs_charWidth_7.json');
const { createCanvas } = canvasExport;

const args = process.argv.slice(2);
const [fileName, ArgVText, columns, rows, scale] = args;

if (!fileName) {
  console.log('You must provide a file name for the gif');
  process.exit(1);
}
if (/[^A-Za-z0-9_-]/.test(fileName)) {
  console.log(
    'Permitted characters must follow format [A-Za-z0-9_-].\nDo not provide an extension.',
  );
  process.exit(1);
}
if (!fs.existsSync('PTR_output')) {
  fs.mkdirSync('PTR_output');
}

run(
  nodePixelTextRenderer({
    text: ArgVText ? ArgVText : defaultText,
    columns: Number(columns) || defaultColumns,
    displayRows: Number(rows) || defaultRows,
    scale: Number(scale) || defaultScale,
    defs,
  }),
  userFrameCapture,
);

function userFrameCapture(ctx, frameMetrics) {
  console.log('Frame Summary');
  console.dir(frameMetrics, { depth: null });
  const encoder = userInitEncoder(ctx);
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
      encoder.finish();
      process.stdout.write(`\nDone! Wrote ${frameSnapShotCounter} frames`);
    },
  ];
}

function userInitEncoder(ctx) {
  const encoder = new GIFEncoder(ctx.canvas.width, ctx.canvas.height);
  encoder
    .createReadStream()
    .pipe(fs.createWriteStream(`PTR_output/${fileName}.gif`));
  encoder.start();
  encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
  encoder.setDelay(20); // frame delay in ms
  encoder.setQuality(5);
  return encoder;
}

function run(state, initFn) {
  const { ctx } = state;
  const frameMetrics = calculateTotalFrames(state);
  const [snapshotFn, onCompleteFn] = initFn(ctx, frameMetrics);
  state.config.snapshot = payload => snapshotFn(payload, ctx);
  drawBorder(state);
  syncDrawWords({
    state,
  });
  onCompleteFn();
}

function nodePixelTextRenderer({ columns, scale, text, defs, displayRows }) {
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
