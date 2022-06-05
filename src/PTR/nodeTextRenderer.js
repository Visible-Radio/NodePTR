const fs = require('fs');
const readline = require('readline');
const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const defs = require('./customDefs_charWidth_7.json');
const { syncDrawWords } = require('./syncDrawingFunctions.js');
const {
  setupCanvas,
  makeWords,
  makeStateSync,
  modifyDefs,
  drawBorder,
  calculateTotalFrames,
} = require('./commonFunctions.js');

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

const fromDoom =
  "You have entered deeply into the <HL>infested <HL>starport, but something is <HL>wrong. The <HL>monsters have brought their own reality with them, and the starport's technology is being <HL>subverted by their presence";

const fromTheThing =
  '<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first contact.';

run(
  nodePixelTextRenderer({
    text: ArgVText ? ArgVText : fromTheThing,
    columns: Number(columns) || 10,
    displayRows: Number(rows) || 5,
    scale: Number(scale) || 5,
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

module.exports = {
  run,
  nodePixelTextRenderer,
};
