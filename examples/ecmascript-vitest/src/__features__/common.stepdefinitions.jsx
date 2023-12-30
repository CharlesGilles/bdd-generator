import { defineStep, defineFileScopes, scenarioContext } from "@charlesgilles/bdd-generator";
import { fonctionImportee } from './fonctionImportee';

defineFileScopes([
    {
        tag: 'lol'
    }
]);

beforeEach(() => {
  scenarioContext.yolo = 10;
});

defineStep(["then"], "YOLO", () => {
  fonctionImportee();
  expect(scenarioContext.yolo).toBe(10);
});
