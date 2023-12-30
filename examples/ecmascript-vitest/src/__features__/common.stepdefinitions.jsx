import { defineStep, defineFileScopes, scenarioContext } from "@charlesgilles/bdd-generator";
import importParDefaut, { fonctionImportee } from './fonctionImportee';

defineFileScopes([
    {
        tag: 'lol'
    }
]);

beforeEach(() => {
  scenarioContext.yolo = 10;
});

defineStep(["given", "then"], "YOLO", () => {
  fonctionImportee();
  expect(importParDefaut).toBe(1);
  expect(scenarioContext.yolo).toBe(10);
});
