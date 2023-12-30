import { ParsedFeature, ParsedScenario } from 'jest-cucumber/dist/src/models';
import { Feature, Imports, StepDefinition, Scenario, StepBlock, ParseStepDefinitionResult, IScope, ExecutionType, Hook, CommonCode, ImportsData } from "./common.types";
import { formatStepMatchingError, formatTwoDefaultImportsError } from "./errors";
import path from 'path';

const stepblocks = ['given', 'when', 'then'];

export function getNewBlock(stepKeyword: string, currentBlock: StepBlock): StepBlock {
    return stepblocks.includes(stepKeyword)
        ? (stepKeyword as StepBlock)
        : currentBlock;
}

export function matchFeatureHooks(feature: ParsedFeature, hooks: Hook[]) {
    return hooks.filter(hook => hook.scopes.some(scope => matchScope(scope, feature.title, undefined, feature.tags)));
}

function matchFeatureCommonCodes(feature: ParsedFeature, commonCodes: CommonCode[]) {
    return commonCodes.filter(commonCode => commonCode.scopes.some(scope => matchScope(scope, feature.title, undefined, feature.tags)));
}

export function getFeatureFileExtension(steps: StepDefinition[]): "js" | "ts" | "jsx" | "tsx" {
    const typescript = steps.some(step => step.fileExtension.ts) ? 't' : 'j';
    const jsx = steps.some(step => step.fileExtension.jsx) ? 'x' : '';
    return `${typescript}s${jsx}`;
}

export function MapExecutionType(feature: ParsedScenario, ignoreExecutionTag: string, onlyExecutionTag: string) {
    if (feature.tags.includes(ignoreExecutionTag)) {
        return ExecutionType.IGNORE;
    }
    if (feature.tags.includes(onlyExecutionTag)) {
        return ExecutionType.ONLY;
    }
    return ExecutionType.CLASSIC;
}

function matchScope(scope: IScope, feature: string, scenario: string, tags: string[]) {
    return (!scope.feature || scope.feature === feature)
        && (!scope.scenario || scope.scenario === scenario)
        && (!scope.tag || tags.includes(`@${scope.tag.toLowerCase()}`));
}

export function findScopeMatchingSteps(steps: StepDefinition[], feature: ParsedFeature, scenario: ParsedScenario) {
    const tags = feature.tags.concat(scenario.tags);
    return steps.filter(step => step.scopes.some(scope => matchScope(scope, feature.title, scenario.title, tags)));
}

const stepsAlreadyInFeatureSteps = (stepDefinition: StepDefinition, scenarioSteps: StepDefinition[]) => scenarioSteps.some(
    scenarioStep => scenarioStep.index === stepDefinition.index
);

function calculateNewPath(from: string, sourceFile: string, featureFile: string){
    if (path.isAbsolute(from)){
        return from;
    }
    const relativePath = path.relative(path.dirname(featureFile), path.dirname(sourceFile));
    return path.posix.join(relativePath, from);
}

export function matchFeatureWithStepsAndHooks(
    cheminFichier: string,
    feature: ParsedFeature,
    parseStepsResult: ParseStepDefinitionResult,
    ignoreExecutionTag: string,
    onlyExecutionTag: string
): Feature {
    const featureSteps: StepDefinition[] = [];
    const featureImports: Imports = new Map<string, ImportsData>();
    const scenariosWithSteps: Scenario[] = [];

    function matchScenariosSteps(scenarios: ParsedScenario[]) {
        scenarios.forEach(scenario => {
            const scenarioWithSteps: Scenario = {
                nom: scenario.title,
                stepsFunctions: [],
                executionType: MapExecutionType(scenario, ignoreExecutionTag, onlyExecutionTag)
            };
            const scopedSteps = findScopeMatchingSteps(parseStepsResult.steps, feature, scenario);
            let currentBlock: StepBlock = 'given';
            scenario.steps.forEach((step) => {
                currentBlock = getNewBlock(step.keyword, currentBlock);
                const stepDefinitions = scopedSteps.filter((stepDefinition) => {
                    if (!stepDefinition.blocks.includes(currentBlock)) {
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

                const stepDefinition = stepDefinitions[0];

                if (!stepsAlreadyInFeatureSteps(stepDefinition, featureSteps)){
                    featureSteps.push(stepDefinition);
                }

                scenarioWithSteps.stepsFunctions.push({
                    block: currentBlock,
                    functionName: stepDefinition.functionName
                });

                stepDefinition.imports.forEach((stepImportData, from) => {
                    const newFrom = calculateNewPath(from, stepDefinition.cheminFichier, cheminFichier);
                    let featureImportsData = featureImports.get(newFrom);

                    if (featureImportsData === undefined) {
                        featureImportsData = stepImportData;
                        featureImports.set(newFrom, stepImportData);
                        return;
                    }

                    if (stepImportData.defaultImport){
                        if (featureImportsData.defaultImport && featureImportsData.defaultImport !== stepImportData.defaultImport){
                            throw new Error(formatTwoDefaultImportsError(
                                newFrom,
                                featureImportsData.defaultImport,
                                stepImportData.defaultImport,
                                cheminFichier,
                                stepDefinition.cheminFichier
                            ));
                        }
                        else {
                            featureImportsData.defaultImport = stepImportData.defaultImport;
                        }
                    }

                    stepImportData.nammedImports.forEach((value) => {
                        featureImportsData.nammedImports.push(value);
                    });
                });

                featureImports.forEach(({ nammedImports, defaultImport, sourceFile }, from, map) => {
                    map.set(from, { sourceFile, defaultImport, nammedImports: [...new Set(nammedImports)] });
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
        rootCommonCodes: matchFeatureCommonCodes(feature, parseStepsResult.rootCommonCodes),
        commonCodesWithScenarioContext: matchFeatureCommonCodes(feature, parseStepsResult.commonCodesWithScenarioContext),
        steps: featureSteps,
        scenarios: scenariosWithSteps,
        extension: getFeatureFileExtension(featureSteps)
    };
}
