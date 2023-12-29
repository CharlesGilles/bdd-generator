// File generated at Fri, 29 Dec 2023 13:16:46 GMT
import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('./src/__features__/onlyThis/onlyThis.feature');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;

	beforeEach(() => {
		scenarioContext = {};
	});

	function Ok(defineMethod){
		defineMethod('ok', () => {
			expect(true).toBeTruthy();
		});
	}

	defineScenario('basic scenario', ({ given, when, then}) => {
		Ok(then);
	});

});
