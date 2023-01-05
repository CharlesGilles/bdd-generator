import { loadFeature } from "jest-cucumber";
import { ParsedFeature, ParsedScenario } from 'jest-cucumber/dist/src/models';
import { Feature, Imports, IScope, StepDefinition, Scenario, StepBlock, ParseStepDefinitionResult, Hook } from "./common.types";
import { formatStepMatchingError } from "./errors";
import { findAllFilesWithMatch } from "./findAllFilesWithMatch";

function matchScope (scope: IScope, feature: string, scenario: string, tags: string[]) {
    return (!scope.feature || scope.feature === feature)
     && (!scope.scenario || scope.scenario === scenario)
     && (!scope.tag || tags.includes(`@${scope.tag.toLowerCase()}`));
}

function findScopeMatchingSteps(steps: StepDefinition[], feature: ParsedFeature, scenario: ParsedScenario){
    const tags = feature.tags.concat(scenario.tags);
    return steps.filter(step => step.scopes.some(scope => matchScope(scope, feature.title, scenario.title, tags)));
}

const stepblocks = ['given', 'when', 'then'];

function getNewBlock(stepKeyword: string,  currentBlock: StepBlock): StepBlock {
    return stepblocks.includes(stepKeyword)
        ? (stepKeyword as StepBlock)
        : currentBlock;
}

function matchFeatureHooks(feature: ParsedFeature, hooks: Hook[]){
    return hooks.filter(hook => hook.scopes.some(scope => matchScope(scope, feature.title, undefined, feature.tags)));
}

function getFeatureFileExtension(steps: StepDefinition[]): "js" | "ts" | "jsx" | "tsx" {
    const typescript = steps.some(step => step.fileExtension.ts) ? 't' : 'j';
    const jsx = steps.some(step => step.fileExtension.jsx) ? 'x' : '';
    return `${typescript}s${jsx}`;
}

function matchFeatureWithStepsAndHooks(cheminFichier: string, feature: ParsedFeature, parseStepsResult: ParseStepDefinitionResult): Feature{
    const featureSteps = new Map<string, StepDefinition>();
    const featureImports: Imports = new Map<string, string[]>();
    const scenariosWithSteps: Scenario[] = [];

    function matchScenariosSteps(scenarios: ParsedScenario[]){
        scenarios.forEach(scenario => {
            const scenarioWithSteps: Scenario = {
                nom: scenario.title,
                stepsFunctions: []
            };
            const scopedSteps = findScopeMatchingSteps(parseStepsResult.steps, feature, scenario);
            let currentBlock: StepBlock = 'given';
            scenario.steps.forEach((step) => {
                currentBlock = getNewBlock(step.keyword, currentBlock);
                const stepDefinitions = scopedSteps.filter((stepDefinition) => {
                  if (stepDefinition.block !== currentBlock) {
                    return false;
                  }
                  const matchResult = step.stepText.match(stepDefinition.match);
                  return matchResult && matchResult[0] === step.stepText;
                });
        
                if (stepDefinitions.length !== 1) {
                  const matchingError = formatStepMatchingError(
                    cheminFichier,
                    feature,
                    scenario,
                    step,
                    stepDefinitions
                  );
                  throw new Error(matchingError);
                }

                featureSteps.set(stepDefinitions[0].functionName, stepDefinitions[0]);
    
                scenarioWithSteps.stepsFunctions.push({ 
                    block: currentBlock,
                    functionName: stepDefinitions[0].functionName
                });

                stepDefinitions[0].imports.forEach((imports, from) => {
                    let importsValues: string[];
                    if (!featureImports.has(from)){
                        importsValues = []
                        featureImports.set(from, importsValues);
                    } else {
                        importsValues = featureImports.get(from);
                    }
                    imports.forEach((value) => {
                        importsValues.push(value);
                    });
                });
                
                featureImports.forEach((values, from, map) => {
                    map.set(from, [...new Set(values)]);
                });
            });
            scenariosWithSteps.push(scenarioWithSteps);
        });
    }

    matchScenariosSteps(feature.scenarios);
    matchScenariosSteps(feature.scenarioOutlines);

    return {
        nom: feature.title,
        cheminFichier,
        tags: feature.tags,
        imports: featureImports,
        hooks: matchFeatureHooks(feature, parseStepsResult.hooks),
        steps: [...featureSteps.values()],
        scenarios: scenariosWithSteps,
        extension: getFeatureFileExtension(parseStepsResult.steps)
    };
}

function parseFeatureFiles(from: string, parseStepsResult: ParseStepDefinitionResult) {
    const featureFilenames = findAllFilesWithMatch(from, /.*\.feature$/);

    return featureFilenames.map(cheminFichier => {
        const feature = loadFeature(cheminFichier, {
            loadRelativePath: false,
            errors: true
        });
        return matchFeatureWithStepsAndHooks(cheminFichier, feature, parseStepsResult);
    });

}

export { parseFeatureFiles };
