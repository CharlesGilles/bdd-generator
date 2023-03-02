import { defineStep, defineFileScopes } from "specflow-generator";

defineFileScopes([
  {
      feature: 'The Only feature that should be generated',
  }
]);


defineStep(['then'], 'ok', () => {
    expect(true).toBeTrue();
});
