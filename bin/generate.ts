#! /usr/bin/env node
import { createStepsFilesFromStepDefinitionsAndFeatures } from "../src";
import * as fs from 'fs';

interface FromType {
    steps?: string,
    features?: string,
    ignoreTag?: string;
}

let from: FromType = null;

if (!fs.existsSync('bdd-generator.json')){
    console.log("Le fichier 'bdd-generator.json' n'est pas présent à la racine du projet.\n");
}
else {
    from = JSON.parse(fs.readFileSync('bdd-generator.json', { encoding: 'utf-8' }));
}

const stepsFrom = from?.steps ?? './src/__features__';
const featuresFrom = from?.features ?? './src/__features__';
const ignoreTag = from?.ignoreTag ?? 'ignore-generation';

if (!fs.existsSync(stepsFrom)){
    throw new Error(`Le dossier "${stepsFrom}" n'existe pas dans le projet. Merci d'indiquer le bon dossier dans le fichier "bdd-generator.json"`);
}
if (!fs.existsSync(featuresFrom)){
    throw new Error(`Le dossier "${featuresFrom}" n'existe pas dans le projet. Merci d'indiquer le bon dossier dans le fichier "bdd-generator.json"`);
}
if (ignoreTag === ''){
    throw new Error(`Le tag permettant d'ignorer la génération ne peut pas être une chaine vide`);
}

createStepsFilesFromStepDefinitionsAndFeatures(stepsFrom, featuresFrom, ignoreTag);
