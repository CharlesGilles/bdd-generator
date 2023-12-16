import { defineStep, defineFileScopes, scenarioContext } from "@charlesgilles/bdd-generator";

defineFileScopes([
  {
      feature: 'Simple Calculator To Skip',
  }
]);

defineStep(["given"], /^the number "(.*)"$/, (value) => {
  if (scenarioContext.numbers) {
    scenarioContext.numbers.push(Number(value));
  } else {
    scenarioContext.numbers = [Number(value)];
  }
});

defineStep(["when"], /^I add them$/, () => {
  scenarioContext.result = scenarioContext.numbers[0] + scenarioContext.numbers[1];
});

defineStep(["when"], /^I multiple them$/, () => {
  scenarioContext.result = scenarioContext.numbers[0] * scenarioContext.numbers[1];
});

defineStep(["then"], /^the result should be "(.*)"$/, result => {
    expect(scenarioContext.result).toBe(Number(result));
});
