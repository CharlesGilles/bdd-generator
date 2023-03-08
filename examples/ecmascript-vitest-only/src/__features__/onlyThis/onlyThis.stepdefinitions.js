import { defineStep, defineFileScopes } from "@charlesgilles/bdd-generator";

defineFileScopes([
  {
      feature: 'The Only feature that should be generated',
  }
]);


defineStep(['then'], 'ok', () => {
    expect(true).toBeTruthy();
});
