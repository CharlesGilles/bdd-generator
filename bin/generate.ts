#! /usr/bin/env node
import { createStepsFilesFromStepDefinitionsAndFeatures } from "../src";
import * as fs from 'fs';
import translator from '../src/translation';

interface FromType {
    lang?: string;
    steps?: string;
    features?: string;
    ignoreGenerationTag?: string;
    onlyGenerationTag?: string;
    ignoreExecutionTag: string;
    onlyExecutionTag: string;
    forceStepsRegeneration?: boolean;
}

let from: FromType = null;

if (!fs.existsSync('bdd-generator.json')){
    console.log("file 'bdd-generator.json' doesn't exists at the project's root.\n");
}
else {
    from = JSON.parse(fs.readFileSync('bdd-generator.json', { encoding: 'utf-8' }));
}

const lang = from?.lang?.trim() ?? 'en';
const stepsFrom = from?.steps?.trim() ?? './src/__features__';
const featuresFrom = from?.features?.trim() ?? './src/__features__';
const ignoreGenerationTag = from?.ignoreGenerationTag?.trim() ?? 'ignore-generation';
const onlyGenerationTag = from?.onlyGenerationTag?.trim() ?? 'only-generation';
const ignoreExecutionTag = from?.ignoreExecutionTag?.trim() ?? 'ignore';
const onlyExecutionTag = from?.onlyExecutionTag?.trim() ?? 'only';
const forceStepsRegeneration = from?.forceStepsRegeneration ?? false;

if (!translator.setTranslation(lang)){
    console.error("cannot print correct logs, exiting.");
    process.exit(1);
}

if (!fs.existsSync(stepsFrom)){
    throw new Error(translator.get('folderDoesntExists', { folder: stepsFrom }));
}
if (!fs.existsSync(featuresFrom)){
    throw new Error(translator.get('folderDoesntExists', { folder: featuresFrom }));
}
if (ignoreGenerationTag === ''){
    throw new Error(translator.get('tagCannotBeEmpty', { tag: 'ignoreGenerationTag'}));
}
if (onlyGenerationTag === ''){
    throw new Error(translator.get('tagCannotBeEmpty', { tag: 'onlyGenerationTag'}));
}
if (ignoreExecutionTag === ''){
    throw new Error(translator.get('tagCannotBeEmpty', { tag: 'ignoreExecutionTag'}));
}
if (onlyExecutionTag === ''){
    throw new Error(translator.get('tagCannotBeEmpty', { tag: 'onlyExecutionTag'}));
}

if (new Set([ignoreExecutionTag, ignoreGenerationTag, onlyExecutionTag, onlyGenerationTag]).size !== 4){
    throw new Error(translator.get('tagConflict'));
}

createStepsFilesFromStepDefinitionsAndFeatures(
    stepsFrom,
    featuresFrom,
    forceStepsRegeneration,
    '@' + ignoreGenerationTag,
    '@' + onlyGenerationTag,
    '@' + ignoreExecutionTag,
    '@' + onlyExecutionTag);
