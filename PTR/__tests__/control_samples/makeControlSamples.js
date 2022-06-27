import { nptr } from '../../nodeTextRenderer.js';
import cs from './index.json' assert { type: 'json' };
const { controlSamples } = cs;

for (let { controlFile, args } of controlSamples) {
  nptr(`${controlFile.slice(0, -4)}-CS`, {
    ...args,
  });
}
