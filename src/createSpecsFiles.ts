import * as fs from 'fs';
import { CommonCode, ExecutionType, Feature, Hook, HookName } from "./common.types";
import translation from './translation';
import { GenerateHashes, Hash, createHashFile, generateMd5Hash, getHashFromFile } from './hashgenerator';
import kleur from "kleur"

const writeFileOptions: fs.WriteFileOptions = {
    encoding: 'utf-8'
};

function writeFileCallback(error: NodeJS.ErrnoException | null) {
    if (error) {
        console.log(error);
    }
}

const hashes = getHashFromFile();
let createdCount = 0;

function writeHeadComment(data: string[], date: string) {
    data.push(`// ${translation.get('generationDate')} ${date}`);
}

function writeImports(data: string[], feature: Feature) {
    data.push("import { defineFeature, loadFeature } from 'jest-cucumber';");
    for (const [from, imports] of feature.imports.entries()) {
        data.push(`import { ${[...imports].join(', ')} } from '${from}';`);
    }
    data.push('');
}

function writeCommonCodes(data: string[], commonCodes: CommonCode[]) {
    for (const commonCode of commonCodes) {
        data.push(`// ${translation.get('commonCodeFrom')} "${commonCode.filename}"\n`);
        data.push(commonCode.code);
        data.push('');
    }
}

function writeFeatureContext(data: string[], feature: Feature) {
    data.push(`const feature = loadFeature('${feature.cheminFichier}');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;`);
}

function escapeApostrophes(chaine: string) {
    return chaine.split("'").join("\\'");
}

function writeHooks(data: string[], hooks: Hook[]) {
    const hooksMap = new Map<HookName, string[]>();
    hooksMap.set('beforeEach', ['scenarioContext = {};']);

    hooks.forEach(hook => {
        let codeLines = hooksMap.get(hook.name);
        if (!codeLines) {
            hooksMap.set(hook.name, hook.code);
        } else {
            codeLines.push(...hook.code);
        }
    });

    hooksMap.forEach((codeLines, hookName) => {
        data.push(`\t${hookName}(() => {`);
        codeLines.forEach(codeLine => {
            data.push(`\t\t${codeLine}`);
        });
        data.push('\t});\n');
    });
}

function writeSteps(data: string[], feature: Feature) {
    feature.steps.forEach(step => {
        data.push(`\tfunction ${step.functionName}(defineMethod){`);
        const codeLines = step.callback.split('\n').map(l => l.trim());
        let i = 0;
        for (let line of codeLines) {
            if (i === 0) {
                const match = typeof (step.match) === 'string'
                    ? "'" + escapeApostrophes(step.match) + "'"
                    : step.match;
                data.push(`\t\tdefineMethod(${match}, ${line}`);
            } else if (i === codeLines.length - 1) {
                data.push(`\t\t${line});`);
            } else {
                data.push(`\t\t\t${line}`);
            }
            i++;
        }
        data.push('\t}\n');
    });
}

function getExecutionTypeCode(executionType: ExecutionType) {
    switch (executionType) {
        case ExecutionType.IGNORE:
            return '.skip';
        case ExecutionType.ONLY:
            return '.only';
        default:
            return ''
    };
}

function writeTests(data: string[], feature: Feature) {
    feature.scenarios.forEach(scenario => {
        const executionTypeCode = getExecutionTypeCode(scenario.executionType);
        data.push(`\tdefineScenario${executionTypeCode}('${escapeApostrophes(scenario.nom)}', ({ given, when, then}) => {`);
        scenario.stepsFunctions.forEach(stepFunction => {
            data.push(`\t\t${stepFunction.functionName}(${stepFunction.block});`);
        })
        data.push('\t});\n');
    });
}

function writeEndFile(data: string[]) {
    data.push("});\n");
}

function checkHashes(featureName: string, featureHashes: Hash){
    return hashes[featureName]?.commonCodes === featureHashes.commonCodes
        && hashes[featureName]?.hooks === featureHashes.hooks
        && hashes[featureName]?.steps === featureHashes.steps
        && hashes[featureName]?.scenarios === featureHashes.scenarios
        && hashes[featureName]?.tags === featureHashes.tags
        && hashes[featureName]?.imports === featureHashes.imports;
}

function createSpecsFile(feature: Feature, forceRegenerateSteps: boolean) {
    const data: string[] = [];

    const featureHashes = GenerateHashes(feature);

    if (!forceRegenerateSteps && checkHashes(feature.nom, featureHashes)){
        return;
    }

    writeHeadComment(data, new Date().toUTCString());
    writeImports(data, feature);
    writeCommonCodes(data, feature.commonCodes);
    writeFeatureContext(data, feature);
    writeHooks(data, feature.hooks);
    writeSteps(data, feature);
    writeTests(data, feature);
    writeEndFile(data);

    // to refactor
    const filePath = `${feature.cheminFichier.substring(0, feature.cheminFichier.lastIndexOf('.'))}.steps.${feature.extension}`;
    fs.writeFile(filePath, data.join('\n'), writeFileOptions, writeFileCallback);

    if (!forceRegenerateSteps){
        hashes[feature.nom] = featureHashes;
        createdCount++;
    }
}

function createSpecsFiles(features: Feature[], forceRegenerateSteps: boolean) {
    features.forEach(feature => {
        createSpecsFile(feature, forceRegenerateSteps);
    });

    if (!forceRegenerateSteps){
        createHashFile(hashes);
        console.log(translation.get("numberOfWrittenSteps", { nbWritten: kleur.green(createdCount) }));
    }
}
export default createSpecsFiles;
