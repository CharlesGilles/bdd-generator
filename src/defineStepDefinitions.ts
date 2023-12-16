import { IScope, StepBlock, StepMatcher } from "./common.types";

/**
 * Read .feature and .stepdefinitions.(js,ts,tsx,jsx) files,
 * match steps with those in feature files.
 * Then it creates .specs.jsx files corresponding
 *
 * @param {StepBlock[]} blocks all the diferents blocks those function can be used for.
 * @param {StepMatcher} match The string or regex which defines the step.
 * @param {Function} cb The function to call if this step is the only one to match and have the corresponding scopes
 * 
 * @example
 * defineStep(['given'], /La variable A est égale à: (.*)/, (scenarioContext) => (a) => {
 *      scenarioContext.a = a;
 * });
 * 
 * //use "Given La variable A est égale à: 13" in a .feature will store 13 in scenarioContext.a
 * 
 * @example
 * defineStep(['given'], /La variable A est égale à: (.*)/, (scenarioContext) => (a) => {
 *      scenarioContext.a = a;
 * }, [
 *  {
 *      tag: 'variables'
 *  }
 * ]);
 */
export function defineStep(blocks: StepBlock[], match: StepMatcher, cb: Function) { }

/**
 * Read .feature and .stepdefinitions.(js,ts,tsx,jsx) files,
 * match given steps with those in feature files.
 * Then it creates .specs.jsx files corresponding
 *
 * @param {StepMatcher} match The string or regex which defines the step.
 * @param {Function} cb The function to call if this step is the only one to match and have the corresponding scopes
 **/
export function given(match: StepMatcher, cb: Function) { }
/**
 * Read .feature and .stepdefinitions.(js,ts,tsx,jsx) files,
 * match when steps with those in feature files.
 * Then it creates .specs.jsx files corresponding
 * 
 * For the same step used for multiple thing (given,when), use defineStep instead
 *
 * @param {StepMatcher} match The string or regex which defines the step.
 * @param {Function} cb The function to call if this step is the only one to match and have the corresponding scopes
 **/
export function when(match: StepMatcher, cb: Function) { }
/**
 * Read .feature and .stepdefinitions.(js,ts,tsx,jsx) files,
 * match then steps with those in feature files.
 * Then it creates .specs.jsx files corresponding
 *
 * @param {StepMatcher} match The string or regex which defines the step.
 * @param {Function} cb The function to call if this step is the only one to match and have the corresponding scopes
 **/
export function then(match: StepMatcher, cb: Function) { }


/**
 * define common scopes for all steps defined in the file this function is called.
 * @param {IScope[]} scopes The path to the folder which contains all needed stepdefinitions files.
 * @example
 *      
 *  defineFileScopes([
 *      {
 *          feature: "Feat 1"
 *      },
 *      {
 *          tag: "tag 1"
 *      }
 *  ]);
 * 
 *  a step is a match if the feature is "Feat 1" OR if tags includes "tag 1"
 */
export function defineFileScopes(scopes: IScope[]) { };
