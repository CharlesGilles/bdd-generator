import * as fs from 'fs';
import { CommonCode, ExecutionType, Feature, Hook, HookName } from "./common.types";
import translation from './translation';
import { GenerateHashes, Hash, createHashFile, getHashFromFile } from './hashgenerator';
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
    for (const [from, { nammedImports, defaultImport, sourceFile }] of feature.imports.entries()) {
        console.log(feature.cheminFichier, from, nammedImports, defaultImport, sourceFile);
        const defaultImportString = defaultImport ?? '';
        const nammedImportsString = nammedImports.length !== 0 ? `{ ${[...nammedImports].join(', ')} }` : '';
        const importsSeparator = defaultImportString && nammedImportsString ? ',' : '';
        data.push(`import ${defaultImportString}${importsSeparator}${nammedImportsString} from '${from}';`);
    }
    data.push('');
}

function writeRootCommonCodes(data: string[], commonCodes: CommonCode[]) {
    for (const commonCode of commonCodes) {
        data.push(`// ${translation.get('commonCodeFrom')} "${commonCode.filename}"\n`);
        data.push(commonCode.code);
        data.push('');
        data.push(`// ${translation.get('endCommonCodeFrom')} "${commonCode.filename}"\n`);
    }
}

function writeFeatureContext(data: string[], feature: Feature) {
    data.push(`const feature = loadFeature('${feature.cheminFichier}');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;
`);
}

function writeCommonCodesWithScenarioContext(data: string[], commonCodes: CommonCode[]) {
    for (const commonCode of commonCodes) {
        data.push(`\t// ${translation.get('commonCodeFrom')} "${commonCode.filename}"\n`);
        data.push(commonCode.code.split('\n').map(l => `\t${l}`).join('\n'));
        data.push('');
        data.push(`\t// ${translation.get('endCommonCodeFrom')} "${commonCode.filename}"\n`);
    }
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

        codeLines.forEach((line, index) => {
            if (index === 0) {
                const match = typeof (step.match) === 'string'
                    ? "'" + escapeApostrophes(step.match) + "'"
                    : step.match;
                const eol = codeLines.length === 1 ? ');' : '';
                data.push(`\t\tdefineMethod(${match}, ${line}${eol}`);
            } else if (index === codeLines.length - 1) {
                data.push(`\t\t${line});`);
            } else {
                data.push(`\t\t\t${line}`);
            }
        });
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
    return hashes[featureName]?.rootCommonCodes === featureHashes.rootCommonCodes
        && hashes[featureName]?.commonCodesWithScenarioContext === featureHashes.commonCodesWithScenarioContext
        && hashes[featureName]?.hooks === featureHashes.hooks
        && hashes[featureName]?.steps === featureHashes.steps
        && hashes[featureName]?.scenarios === featureHashes.scenarios
        && hashes[featureName]?.tags === featureHashes.tags
        && hashes[featureName]?.imports === featureHashes.imports;
}

function createSpecsFile(feature: Feature, forceStepsRegeneration: boolean) {
    const data: string[] = [];

    const featureHashes = GenerateHashes(feature);

    if (!forceStepsRegeneration && checkHashes(feature.nom, featureHashes)){
        return;
    }

    writeHeadComment(data, new Date().toUTCString());
    writeImports(data, feature);
    writeRootCommonCodes(data, feature.rootCommonCodes);
    writeFeatureContext(data, feature);
    writeCommonCodesWithScenarioContext(data, feature.commonCodesWithScenarioContext);
    writeHooks(data, feature.hooks);
    writeSteps(data, feature);
    writeTests(data, feature);
    writeEndFile(data);

    // to refactor
    const filePath = `${feature.cheminFichier.substring(0, feature.cheminFichier.lastIndexOf('.'))}.steps.${feature.extension}`;
    fs.writeFile(filePath, data.join('\n'), writeFileOptions, writeFileCallback);

    if (!forceStepsRegeneration){
        hashes[feature.nom] = featureHashes;
        createdCount++;
    }
}

function createSpecsFiles(features: Feature[], forceStepsRegeneration: boolean) {
    features.forEach(feature => {
        createSpecsFile(feature, forceStepsRegeneration);
    });

    if (!forceStepsRegeneration){
        createHashFile(hashes);
        console.log(translation.get("numberOfWrittenSteps", { nbWritten: kleur.green(createdCount) }));
    }
}
export default createSpecsFiles;
