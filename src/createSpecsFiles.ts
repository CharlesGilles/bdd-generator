import * as fs from 'fs';
import { Feature, Hook, HookName } from "./common.types";

const writeFileOptions: fs.WriteFileOptions = {
    encoding: 'utf-8'
};

function writeFileCallback(error: NodeJS.ErrnoException | null){
    if (error){
		console.log(error);
	}
}

function writeImports(data: string[], feature: Feature){
	data.push("import { defineFeature, loadFeature } from 'jest-cucumber';");
    for (const [from, imports] of feature.imports.entries()){
        data.push(`import { ${[...imports].join(', ')} } from '${from}';`);
    }
}

function writeFeatureContext(data: string[], feature: Feature){
    data.push(`const feature = loadFeature('${feature.cheminFichier}');

defineFeature(feature, (defineScenario) => {
	let scenarioContext;`);
}

function escapeApostrophes(chaine: string){
	return chaine.split("'").join("\\'");
}

function writeHooks(data: string[], hooks: Hook[]){
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
        data.push(`\n\t${hookName}(() => {`);
        codeLines.forEach(codeLine => {
            data.push(`\t\t${codeLine}`);
        });
        data.push('\t});');
    });
}

function writeSteps(data: string[], feature: Feature){
    feature.steps.forEach(step => {
        data.push(`\n\tfunction ${step.functionName}(defineMethod){`);
        const codeLines = step.callback.split('\n').map(l => l.trim());
        let i = 0;
        for (let line of codeLines){
            if (i===0) {
				const match = typeof(step.match) === 'string'
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
        data.push('\t}');
    });
}

function writeTests(data: string[], feature: Feature){
    feature.scenarios.forEach(scenario => {
        data.push(`\n\tdefineScenario('${escapeApostrophes(scenario.nom)}', ({ given, when, then}) => {`);
        scenario.stepsFunctions.forEach(stepFunction => {
            data.push(`\t\t${stepFunction.functionName}(${stepFunction.block});`);
        })
        data.push('\t});');
    });
}

function writeEndFile(data: string[]){
    data.push("});\n");
}

function createSpecsFile(feature: Feature){
    const data: string[] = [];

    writeImports(data, feature);
    writeFeatureContext(data, feature);
    writeHooks(data, feature.hooks);
    writeSteps(data, feature);
    writeTests(data, feature);
    writeEndFile(data);

    const filePath = `${feature.cheminFichier.substring(0, feature.cheminFichier.lastIndexOf('.'))}.steps.${feature.extension}`;
    fs.writeFile(filePath, data.join('\n'), writeFileOptions, writeFileCallback);
}

function createSpecsFiles(features: Feature[]) {
    features.forEach(feature => {
        createSpecsFile(feature);
    });
}

export default createSpecsFiles;
