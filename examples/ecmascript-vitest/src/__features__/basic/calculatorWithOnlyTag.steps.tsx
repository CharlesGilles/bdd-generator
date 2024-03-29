// Fichier généré le Wed, 08 Nov 2023 09:35:56 GMT
import { defineFeature, loadFeature } from 'jest-cucumber';
const feature = loadFeature('./src/__features__/basic/calculatorWithOnlyTag.feature');

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

	defineScenario.only('Simple addition', ({ given, when, then}) => {
		TheNumber(given);
		TheNumber(given);
		IAddThem(when);
		TheResultShouldBe(then);
	});

	defineScenario.skip('Simple multiplication', ({ given, when, then}) => {
		TheNumber(given);
		TheNumber(given);
		IMultipleThem(when);
		TheResultShouldBe(then);
	});
});
