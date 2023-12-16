// Fichier généré le Sat, 16 Dec 2023 11:57:55 GMT
import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('./src/__features__/basic/calculator.feature');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;
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
		defineMethod(/^I add them$/, () => {
			scenarioContext.result = scenarioContext.numbers[0] + scenarioContext.numbers[1];
		});
	}

	function TheResultShouldBe(defineMethod){
		defineMethod(/^the result should be "(.*)"$/, result => {
			expect(scenarioContext.result).toBe(Number(result));
		});
	}

	function IMultipleThem(defineMethod){
		defineMethod(/^I multiple them$/, () => {
			scenarioContext.result = scenarioContext.numbers[0] * scenarioContext.numbers[1];
		});
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
