
import { defineStep, defineFileScopes, scenarioContext } from "@charlesgilles/bdd-generator";

interface ITest {
}

defineFileScopes([
  {
      feature: 'Simple Calculator 2',
      tag: 'feature'
  }
]);

defineStep(["given"], /^the number "(.*)"$/, (value: string) => {
    if (scenarioContext.numbers) {
      scenarioContext.numbers.push(Number(value));
    } else {
      scenarioContext.numbers = [Number(value)];
    }
  });