import { parseStepsFiles } from "./parseStepsFiles";
import createSpecsFiles from "./createSpecsFiles";
import { parseFeatureFiles } from "./parseFeatureFiles";
import kleur from "kleur";

function logStepTime(begin: number, label: string, extra?: string){
    const now = performance.now();
    const nbMs = now - begin;
    const executionTime = nbMs > 1000 
        ? (nbMs / 1000).toPrecision(3) + ' seconds'
        : nbMs.toFixed(2) + ' miliseconds';
    let toLog = `Execution time to "${kleur.yellow(label)}": ${kleur.bold(executionTime)}`;
    if (extra){
        toLog += ' ' + kleur.cyan(extra);
    }
    console.log(toLog);

    return now;
}

/**
 * Read .feature and .stepdefinitions.(js,ts,tsx,jsx) files,
 * match steps with those in feature files.
 * Then it creates .specs.jsx files corresponding
 * @TODO changer de fichier ne plus exporter 
 *
 * @param {string} stepsFrom The path to the folder which contains all needed stepdefinitions files.
 * @param {string} featuresFrom The path to the folder which contains all needed feature files.
 */
export function createStepsFilesFromStepDefinitionsAndFeatures(stepsFrom: string, featuresFrom: string){
    let t = performance.now();
    const parseStepsResult = parseStepsFiles(stepsFrom);
    t = logStepTime(t, 'Parsing stepdefinitions files', `${parseStepsResult.steps.length} stepDefinitions parsed`);

    const features = parseFeatureFiles(featuresFrom, parseStepsResult);
    t = logStepTime(t, 'Parsing feature files', `${features.length} features parsed`);
    
    createSpecsFiles(features);
    logStepTime(t, 'Writing steps files');
}

export { defineFileScopes, defineStep } from './defineStepDefinitions';

export const scenarioContext: any = {};
