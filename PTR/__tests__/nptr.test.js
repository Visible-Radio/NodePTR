import { readFile, unlink } from 'node:fs/promises';
import { nptr } from '../nodeTextRenderer';
import cs from './control_samples/index.json';
const { controlSamples } = cs;

await Promise.all(
  controlSamples.map(({ controlFile, args }) =>
    nptr(`PTR/__tests__/TEST_OUTPUT/${controlFile.slice(0, -4)}-TEST`, {
      ...args,
    }),
  ),
);

describe('nptr output matches control samples', () => {
  for (let { controlFile } of controlSamples) {
    test(`Test against ${controlFile}`, async () => {
      const controlBuffer = await readFile(
        `PTR/__tests__/control_samples/${controlFile.slice(0, -4)}-CS.gif`,
      );
      const testBuffer = await readFile(
        `PTR/__tests__/TEST_OUTPUT/${controlFile.slice(0, -4)}-TEST.gif`,
      );
      expect(testBuffer.equals(controlBuffer));
      // cleanup
      await unlink(
        `PTR/__tests__/TEST_OUTPUT/${controlFile.slice(0, -4)}-TEST.gif`,
      );
    });
  }
});
