import { defineStep, defineFileScopes, scenarioContext } from "@charlesgilles/bdd-generator";
import { PasswordValidator } from "../../password-validator";
import lol from '../fonctionImportee';

defineFileScopes([
    {
        feature: 'Logging in',
        tag: 'feature'
    }
]);

beforeEach(() => {
  scenarioContext.x = 10;
});

afterEach(() => scenarioContext.x = undefined);

defineStep(["given"], "I have previously created a password", () => {
  let passwordValidator = new PasswordValidator();
  scenarioContext.accessGranted = false;

  passwordValidator.setPassword("1234");
  scenarioContext.passwordValidator = passwordValidator;
});

defineStep(["when"], "I enter my password correctly", () => {
  scenarioContext.accessGranted = scenarioContext.passwordValidator.validatePassword("1234");
});

defineStep(["then"], "I should be granted access", () => {
  expect(scenarioContext.accessGranted).toBe(true);
  expect(lol).toBe(1);
});
