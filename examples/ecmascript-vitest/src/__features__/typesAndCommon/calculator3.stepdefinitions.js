

import { defineStep, defineFileScopes, scenarioContext } from "@charlesgilles/bdd-generator";

defineFileScopes([
  {
      feature: 'Simple Calculator 2',
      tag: 'feature'
  }
]);


defineStep(['then'], /the result should be "(.*)"/, result => {
    expect(scenarioContext.result).toBe(Number(result));
});