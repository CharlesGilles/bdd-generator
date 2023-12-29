// Fichier généré le Fri, 29 Dec 2023 13:16:12 GMT
import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('./src/__features__/basic/calculator.feature');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;

	// Code commun à "./src/__features__/basic/calculator.stepdefinitions.js"

	const iMultipleThem = function () {
	  scenarioContext.result = scenarioContext.numbers[0] * scenarioContext.numbers[1];
	};

	// Fin du code commun à "./src/__features__/basic/calculator.stepdefinitions.js"

	beforeEach(() => {
		scenarioContext = {};
	});

	function TheNumber(defineMethod){
		defineMethod(/^the number "(.*)"$/, value => {
			if (scenarioContext.numbers) {
			scenarioContext.numbers.push(Number(value));
			} else {
			scenarioContext.numbers = [Number(value)];
			}
		});
	}

	function IAddThem(defineMethod){
		defineMethod(/^I add them$/, function () {
			scenarioContext.result = scenarioContext.numbers[0] + scenarioContext.numbers[1];
		});
	}

	function TheResultShouldBe(defineMethod){
		defineMethod(/^the result should be "(.*)"$/, result => {
			expect(scenarioContext.result).toBe(Number(result));
		});
	}

	function IMultipleThem(defineMethod){
		defineMethod(/^I multiple them$/, iMultipleThem);
	}

	defineScenario('Simple addition', ({ given, when, then}) => {
		TheNumber(given);
		TheNumber(given);
		IAddThem(when);
		TheResultShouldBe(then);
	});

	defineScenario('Simple multiplication', ({ given, when, then}) => {
		TheNumber(given);
		TheNumber(given);
		IMultipleThem(when);
		TheResultShouldBe(then);
	});

	defineScenario.skip('Simple multiplication to ignore', ({ given, when, then}) => {
		TheNumber(given);
		TheNumber(given);
		IMultipleThem(when);
		TheResultShouldBe(then);
	});

});
