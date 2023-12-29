// Fichier généré le Fri, 29 Dec 2023 13:16:12 GMT
import { defineFeature, loadFeature } from 'jest-cucumber';
import { PasswordValidator } from '../../password-validator';

const feature = loadFeature('./src/__features__/basic-with-imports/basic-scenarios.feature');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;

	beforeEach(() => {
		scenarioContext = {};
		scenarioContext.yolo = 10;
		scenarioContext.x = 10;
	});

	afterEach(() => {
		scenarioContext.x = undefined
	});

	function IHavePreviouslyCreatedAPassword(defineMethod){
		defineMethod('I have previously created a password', () => {
			let passwordValidator = new PasswordValidator();
			scenarioContext.accessGranted = false;
			passwordValidator.setPassword("1234");
			scenarioContext.passwordValidator = passwordValidator;
		});
	}

	function IEnterMyPasswordCorrectly(defineMethod){
		defineMethod('I enter my password correctly', () => {
			scenarioContext.accessGranted = scenarioContext.passwordValidator.validatePassword("1234");
		});
	}

	function IShouldBeGrantedAccess(defineMethod){
		defineMethod('I should be granted access', () => {
			expect(scenarioContext.accessGranted).toBe(true);
		});
	}

	function YOLO(defineMethod){
		defineMethod('YOLO', () => {
			expect(scenarioContext.yolo).toBe(10);
		});
	}

	defineScenario('Entering a correct password', ({ given, when, then}) => {
		IHavePreviouslyCreatedAPassword(given);
		IEnterMyPasswordCorrectly(when);
		IShouldBeGrantedAccess(then);
	});

	defineScenario('test tolo', ({ given, when, then}) => {
		YOLO(then);
	});

});
