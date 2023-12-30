// Fichier généré le Sat, 30 Dec 2023 14:16:57 GMT
import { defineFeature, loadFeature } from 'jest-cucumber';

// Code commun à "./src/__features__/typesAndCommon/calculator1.stepdefinitions.ts"

interface ITest {}

// Fin du code commun à "./src/__features__/typesAndCommon/calculator1.stepdefinitions.ts"

// Code commun à "./src/__features__/typesAndCommon/calculator2.stepdefinitions.ts"

interface ITest {}
type Operation = 'multiply' | 'add' | 'substract' | 'divide';
function getOperator(operation: Operation) {
  switch (operation) {
    case 'add':
      return (a: number, b: number) => a + b;
    case 'substract':
      return (a: number, b: number) => a - b;
    case 'multiply':
      return (a: number, b: number) => a * b;
    case 'divide':
      return (a: number, b: number) => a / b;
  }
}

// Fin du code commun à "./src/__features__/typesAndCommon/calculator2.stepdefinitions.ts"

const feature = loadFeature('./src/__features__/typesAndCommon/calculator.feature');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;

	beforeEach(() => {
		scenarioContext = {};
	});

	function TheNumber(defineMethod){
		defineMethod(/^the number "(.*)"$/, (value: string) => {
			if (scenarioContext.numbers) {
			scenarioContext.numbers.push(Number(value));
			} else {
			scenarioContext.numbers = [Number(value)];
			}
		});
	}

	function IMultiplyaddsubstractdivideThem(defineMethod){
		defineMethod(/I (multiply|add|substract|divide) them/, (operation: Operation) => {
			scenarioContext.result = getOperator(operation)(scenarioContext.numbers[0], scenarioContext.numbers[1]);
		});
	}

	function TheResultShouldBe(defineMethod){
		defineMethod(/the result should be "(.*)"/, result => {
			expect(scenarioContext.result).toBe(Number(result));
		});
	}

	defineScenario('Simple addition', ({ given, when, then}) => {
		TheNumber(given);
		TheNumber(given);
		IMultiplyaddsubstractdivideThem(when);
		TheResultShouldBe(then);
	});

	defineScenario('Simple division', ({ given, when, then}) => {
		TheNumber(given);
		TheNumber(given);
		IMultiplyaddsubstractdivideThem(when);
		TheResultShouldBe(then);
	});

});
