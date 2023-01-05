import * as fs from 'fs';
import { parse as parseFile} from '@babel/parser';
import { ArgumentPlaceholder, ArrayExpression, CallExpression, Expression, Identifier, JSXNamespacedName, ObjectExpression, SpreadElement } from '@babel/types';
import { Imports, IScope, StepDefinition, StepBlock, StepMatcher, HookName, ParseStepDefinitionResult, Hook } from './common.types';
import { findAllFilesWithMatch } from './findAllFilesWithMatch';
import { formatStepsFileParsingError } from './errors';
import generate from '@babel/generator';

const stepBlocks = ['given', 'when', 'then'];
const scopeTypes = ['feature', 'scenario', 'tag'];
const importsToDelete = ['defineStep', 'defineFileScopes', 'scenarioContext'];
const packageName = 'specflow-generator';

function getOneScope(object: ObjectExpression): IScope {
    const scope: IScope = {};
    object.properties.forEach(propertie => {
        if (propertie.type !== 'ObjectProperty' || propertie.key.type !== 'Identifier' || propertie.value.type !== 'StringLiteral'){
            throw new Error();
        }
        if (!scopeTypes.includes(propertie.key.name)){
            console.error(propertie.key);
            throw new Error(`${propertie.key.name} is not a valid scope [feature, scenario, tag] on line ${propertie.loc.start.line} column ${propertie.loc.start.column}`);
        }
        scope[propertie.key.name] = propertie.value.value;
    });
    return scope;
}

function getScopes(array: ArrayExpression){
    const scopes: IScope[] = [];
    array.elements.forEach(elem => {
        if (elem.type !== 'ObjectExpression'){
            throw new Error("elements param should be IScope");
        }
        scopes.push(getOneScope(elem));
    });
    return scopes;
}

function getFileScopes(f: CallExpression): IScope[] {
    if (f.arguments.length !== 1){
        throw new Error("defineFileScopes call should have one array argument");
    }
    const arg = f.arguments[0];
    if (arg.type !== 'ArrayExpression'){
        throw new Error("first param of defineFileScopes should be an array of IScope");
    }
    return getScopes(arg);
}

function getStepDefinitionBlocks(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder)): StepBlock[] {
    if (arg.type !== 'ArrayExpression'){
        throw new Error("first param of defineStep call should be an array of 'given', 'when' or 'then'");
    }
    const blocks: Set<StepBlock> = new Set();
    arg.elements.forEach(elem => {
        if (elem.type !== 'StringLiteral' || !stepBlocks.includes(elem.value)){
            throw new Error("first param of defineStep call should be an array of 'given', 'when' or 'then'");
        }
        blocks.add(elem.value as StepBlock);
    });
    return [...blocks.values()];
}

function getStepDefinitionMatch(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder)): StepMatcher {
    if (arg.type === 'RegExpLiteral'){
        return new RegExp(arg.pattern);
    } else if (arg.type === 'StringLiteral'){
        return arg.value;
    } else {
        throw new Error("second param of defineStep call should be a string or a regex");
    }
}

function getStepDefititionCallback(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder)): string {
    if (arg.type !== 'ArrowFunctionExpression'){
        throw new Error("should be an arrow expression");
    }

    return generate(arg).code;
}

function getStepDefitionScopes(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder), cheminFichier: string): IScope[] {
    if (arg.type !== 'ArrayExpression'){
        throw new Error(formatStepsFileParsingError(
            cheminFichier,
            arg.loc,
            "first param of defineFileScopes should be an array of IScope"
        ));
    }
    return getScopes(arg);
}

const wordsRegex = /[^\w\s]+/gu;
function createFunctionName(match: StepMatcher): string {
    const source = typeof(match) === 'string'
        ? match
        : match.source;
    return source.replace(wordsRegex, '')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
}

function getStepDefinition(cheminFichier: string, defineStep: CallExpression): Omit<StepDefinition, 'imports'>[] {
    if (defineStep.arguments.length !== 3 && defineStep.arguments.length !== 4){
        throw new Error(formatStepsFileParsingError(
            cheminFichier,
            defineStep.loc,
            "defineStep call should have these parameters: blocks, match, callback, [scopes]"
        ));
    }
    const blocks = getStepDefinitionBlocks(defineStep.arguments[0]);
    const match = getStepDefinitionMatch(defineStep.arguments[1]);
    const functionName = createFunctionName(match);
    const callback = getStepDefititionCallback(defineStep.arguments[2]);
    const scopes = defineStep.arguments.length === 4
        ? getStepDefitionScopes(defineStep.arguments[3], cheminFichier)
        : [];

    const fileExtension = cheminFichier.substring(cheminFichier.lastIndexOf('.') + 1);


    return blocks.map(block => ({
        block,
        match,
        callback,
        scopes,
        functionName,
        cheminFichier,
        fileExtension: {
            jsx: fileExtension.endsWith('x'),
            ts: fileExtension.startsWith('t')
        }
    }));
}

function removePackageImports(imports: Imports){
    const packageImports = imports.get(packageName).filter(i => !importsToDelete.includes(i));
    if (packageImports.length === 0){
        imports.delete(packageName);
    } else {
        imports.set(packageName, packageImports);
    }
}

function getHook(cheminFichier: string, hookCall: CallExpression): Partial<Hook> {
    const hookName = (hookCall.callee as Identifier).name;
    if (hookCall.arguments.length !== 1 ){
        throw new Error(formatStepsFileParsingError(
            cheminFichier,
            hookCall.loc,
            `${hookName} call should have only one parameter`
        ));
    }

    return {
        name: hookName as HookName,
        code: generate(hookCall, { }).code
    };
}

function parseOneStepFile(cheminFichier: string): ParseStepDefinitionResult {
    const ast = parseFile(fs.readFileSync(cheminFichier, {
        encoding: 'utf-8'
    }).toString(), {
        plugins: [
            "jsx",
            "typescript"
        ],
        sourceType: 'module'
    });

    let fileScopes: IScope[];
    const imports: Imports = new Map<string, string[]>();
    const stepDefinitions: Partial<StepDefinition>[] = [];
    const hooks: Partial<Hook>[] = [];
    
    ast.program.body.forEach(x => {
        switch(x.type){
            case 'ImportDeclaration':
                let importsValues = imports.get(x.source.value);
                if (!importsValues){
                    importsValues = [];
                    imports.set(x.source.value, importsValues);
                }
                importsValues.push(...x.specifiers.map(specifier => specifier.local.name));
                break;
            case 'ExpressionStatement':
                if (x.expression.type !== 'CallExpression' || x.expression.callee.type !== 'Identifier'){
                    throw new Error(formatStepsFileParsingError(
                        cheminFichier,
                        x.loc,
                        'blablabla'
                    ));
                }
                switch (x.expression.callee.name) {
                    case 'defineFileScopes':
                        if (!imports.get(packageName)?.includes('defineFileScopes')){
                            throw new Error(formatStepsFileParsingError(
                                cheminFichier,
                                x.loc,
                                "defineFileScopes should be imported from 'specflow-generator' before any call"
                            ));
                        }
                        fileScopes = getFileScopes(x.expression);
                        break;
                    case 'defineStep':
                        if (!imports.get(packageName)?.includes('defineStep')){
                            throw new Error(formatStepsFileParsingError(
                                cheminFichier,
                                x.loc,
                                "defineStep should be imported from 'specflow-generator' before any call"
                            ));
                        }
                        stepDefinitions.push(...getStepDefinition(cheminFichier, x.expression));
                        break;
                    case 'beforeAll':
                    case 'beforeEach':
                    case 'afterEach':
                    case 'afterAll':
                        hooks.push(getHook(cheminFichier, x.expression));
                        break;
                    default:
                        throw new Error(formatStepsFileParsingError(
                            cheminFichier,
                            x.loc,
                            'defineFileScopes and defineStep are the only function that can be call in this file.'
                        ));
                }
                break;
            default:
                throw new Error(formatStepsFileParsingError(
                    cheminFichier,
                    x.loc,
                    'This file must only imports things, define the file scopes and the steps.'
                ));
        }
    });

    removePackageImports(imports);

    stepDefinitions.forEach(stepDefinition => {
        stepDefinition.scopes.push(...fileScopes);

        imports.forEach((values, from, map) => {
            map.set(from, [...new Set(values)]);
        });

        stepDefinition.imports = imports;
    });

    hooks.forEach(hook => {
        hook.scopes = fileScopes
    });

    return {
        steps: stepDefinitions as StepDefinition[],
        hooks: hooks as Hook[]
    };
}

function findAllStepsFiles(from: fs.PathLike): string[] {
    return findAllFilesWithMatch(from, /.*\.stepdefinitions\.([tj]sx?)/);
}

function parseStepsFiles(from: fs.PathLike): ParseStepDefinitionResult {
    const parsed = findAllStepsFiles(from).map(cheminFichier => parseOneStepFile(cheminFichier));
    const hooks = parsed.flatMap(p => p.hooks); 
    const steps = parsed.flatMap(p => p.steps); 

    return {
        hooks,
        steps
    };
}

export { parseStepsFiles };
