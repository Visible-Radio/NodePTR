import fs from 'fs';
import {
  defaultText,
  defaultColumns,
  defaultRows,
  defaultScale,
} from './constants.js';

import defs from './CHARDEFS/customDefs_charWidth_7.js';
import {
  GIFEncoderFrameCapture,
  prepareModel,
  run,
} from './nodeTextRenderer.js';

const args = process.argv.slice(2);
const [fileName, ArgVText, columns, rows, scale] = args;

if (!fileName) {
  console.log('You must provide a file name for the gif');
  process.exit(1);
}
if (/[^/A-Za-z0-9_-]/.test(fileName)) {
  console.log(
    'Permitted characters must follow format [A-Za-z0-9_-].\nDo not provide an extension.',
  );
  process.exit(1);
}

const path = fileName.split('/').slice(0, -1);

if (path.length && !fs.existsSync(path.join('/'))) {
  fs.mkdirSync(path.join('/'), { recursive: true });
}

run(
  fileName,
  prepareModel({
    text: ArgVText ? ArgVText : defaultText,
    columns: Number(columns) || defaultColumns,
    displayRows: Number(rows) || defaultRows,
    scale: Number(scale) || defaultScale,
    defs,
  }),
  GIFEncoderFrameCapture,
);
