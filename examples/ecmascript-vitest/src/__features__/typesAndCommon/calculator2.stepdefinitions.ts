

import { defineStep, defineFileScopes, scenarioContext } from "@charlesgilles/bdd-generator";

interface ITest {
}

type Operation = 'multiply' | 'add' | 'substract' | 'divide';

defineFileScopes([
  {
      feature: 'Simple Calculator 2',
      tag: 'feature'
  }
]);

function getOperator(operation: Operation){
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

defineStep(['when'], /I (multiply|add|substract|divide) them/, (operation: Operation) => {
    scenarioContext.result = getOperator(operation)(scenarioContext.numbers[0], scenarioContext.numbers[1]);
});