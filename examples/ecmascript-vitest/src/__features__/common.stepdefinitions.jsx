import { defineStep, defineFileScopes, scenarioContext } from "specflow-generator";

defineFileScopes([
    {
        tag: 'lol'
    }
]);

beforeEach(() => {
  scenarioContext.yolo = 10;
});

defineStep(["then"], "YOLO", () => {
  expect(scenarioContext.yolo).toBe(10);
});
