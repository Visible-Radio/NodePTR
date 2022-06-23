import { nptr } from '../nodeTextRenderer';
import cs from './control_samples/index.json';
import fs from 'fs';
const { controlSamples } = cs;

describe('nptr output matches control samples', () => {
  for (let { controlFile, args } of controlSamples) {
    test(`Test against ${controlFile}`, async () => {
      nptr(`PTR/__tests__/TEST_OUTPUT/${controlFile.slice(0, -4)}-TEST`, {
        ...args,
      });
      const testBuffer = fs.readFileSync(
        `PTR/__tests__/TEST_OUTPUT/${controlFile.slice(0, -4)}-TEST.gif`,
      );
      const controlBuffer = fs.readFileSync(
        `PTR/__tests__/control_samples/${controlFile.slice(0, -4)}-CS.gif`,
      );
      expect(testBuffer.equals(controlBuffer));

      // we should delete the file we just created in TEST_OUTPUT
    });
  }
});
// maybe the cleanup should happen in an afterAll block - let all tests run
// then clean out the entire dir
