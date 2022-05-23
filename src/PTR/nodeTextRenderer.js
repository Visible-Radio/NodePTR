const readline = require('readline');
const commonFunctions = require('./commonFunctions.js');
const { setupCanvas, makeWords, makeStateSync, modifyDefs, drawBorder } =
  commonFunctions;
const syncDrawingFunctions = require('./syncDrawingFunctions.js');
const { syncDrawWords } = syncDrawingFunctions;
const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
const fs = require('fs');
const defs = require('./customDefs_charWidth_7.json');

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

const fromTheThing =
  '<HL>Projection:\n if <HL>intruder <HL>organism reaches civilized areas\n ...Entire world population infected <HL>27,000 hours from first contact.';

nodePixelTextRenderer({
  text: ArgVText ? ArgVText : 'hello world',
  columns: Number(columns) || 10,
  displayRows: Number(rows) || 5,
  scale: Number(scale) || 3,
  defs,
});

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

  const encoder = new GIFEncoder(ctx.canvas.width, ctx.canvas.height);
  encoder
    .createReadStream()
    .pipe(fs.createWriteStream(`PTR_output/${fileName}.gif`));
  encoder.start();
  encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
  encoder.setDelay(20); // frame delay in ms
  encoder.setQuality(5);

  let frameSnapShotCounter = 0;
  const frameMetrics = calculateTotalFrames(state);

  state.config.snapshot = payload => {
    if (payload?.last) {
      encoder.setDelay(1000);
    }
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
  };
  drawBorder(state);
  syncDrawWords({
    state,
  });
  encoder.finish();
  process.stdout.write(`\nDone! Wrote ${frameSnapShotCounter} frames`);
}

function calculateTotalFrames(state) {
  const {
    totalRows,
    displayRows,
    charWidth,
    charCount: numberOfChars,
  } = state.config;
  const numberOfScrollEvents = Math.ceil(totalRows / displayRows) - 1;
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
