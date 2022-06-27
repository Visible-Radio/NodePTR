import { readFile, unlink } from 'node:fs/promises';
import { nptr } from '../nodeTextRenderer';
import cs from './control_samples/index.json';
const { controlSamples } = cs;

describe('nptr output matches control samples', () => {
  for (let { controlFile, args } of controlSamples) {
    nptr(`PTR/__tests__/TEST_OUTPUT/${controlFile.slice(0, -4)}-TEST`, {
      ...args,
    });
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
