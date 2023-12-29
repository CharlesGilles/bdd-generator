import * as fs from 'fs';
import { parse as parseFile } from '@babel/parser';
import { ArgumentPlaceholder, ArrayExpression, CallExpression, Expression, Identifier, JSXNamespacedName, ObjectExpression, SourceLocation, SpreadElement } from '@babel/types';
import { Imports, IScope, StepDefinition, StepBlock, StepMatcher, HookName, ParseStepDefinitionResult, Hook, CommonCode } from './common.types';
import { findAllFilesWithMatch } from './findAllFilesWithMatch';
import { formatStepsFileParsingError } from './errors';
import translation from './translation';
import generate from '@babel/generator';

const stepBlocks = ['given', 'when', 'then'];
const scopeTypes = ['feature', 'scenario', 'tag'];
const importsToDelete = ['defineStep', 'defineFileScopes', 'scenarioContext', "given", "when", "then"];
const packageName = '@charlesgilles/bdd-generator';
let nextStepDefinitionIndex = 0;

let cheminFichierEnCours: string;

function createFormatStepsFileParsingError(location: SourceLocation, errorDetails: string) {
    return new Error(formatStepsFileParsingError(cheminFichierEnCours, location, errorDetails));
}

function getOneScope(object: ObjectExpression): IScope {
    const scope: IScope = {};
    object.properties.forEach(propertie => {
        if (propertie.type !== 'ObjectProperty' || propertie.key.type !== 'Identifier' || propertie.value.type !== 'StringLiteral') {
            throw new Error();
        }
        if (!scopeTypes.includes(propertie.key.name)) {
            console.error(propertie.key);
            throw createFormatStepsFileParsingError(propertie.key.loc, translation.get('invalidScope', { scope: propertie.key.name }));
        }
        scope[propertie.key.name] = propertie.value.value;
    });
    return scope;
}

function getScopes(array: ArrayExpression) {
    const scopes: IScope[] = [];
    array.elements.forEach(elem => {
        if (elem.type !== 'ObjectExpression') {
            throw createFormatStepsFileParsingError(elem.loc, translation.get('invalidScope'));
        }
        scopes.push(getOneScope(elem));
    });
    return scopes;
}

function getFileScopes(f: CallExpression): IScope[] {
    if (f.arguments.length !== 1) {
        throw createFormatStepsFileParsingError(f.loc, translation.get('defineFileScopesParam'));
    }
    const arg = f.arguments[0];
    if (arg.type !== 'ArrayExpression') {
        throw createFormatStepsFileParsingError(arg.loc, translation.get('defineFileScopesParam'));
    }
    return getScopes(arg);
}

function getStepDefinitionBlocks(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder)): StepBlock[] {
    if (arg.type !== 'ArrayExpression') {
        throw createFormatStepsFileParsingError(arg.loc, translation.get('defineStepFirstParam'));
    }
    const blocks: Set<StepBlock> = new Set();
    arg.elements.forEach(elem => {
        if (elem.type !== 'StringLiteral' || !stepBlocks.includes(elem.value)) {
            throw createFormatStepsFileParsingError(arg.loc, translation.get('defineStepFirstParam'));
        }
        blocks.add(elem.value as StepBlock);
    });
    return [...blocks.values()];
}

function getStepDefinitionMatch(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder)): StepMatcher {
    if (arg.type === 'RegExpLiteral') {
        return new RegExp(arg.pattern);
    } else if (arg.type === 'StringLiteral') {
        return arg.value;
    } else {
        throw createFormatStepsFileParsingError(arg.loc, translation.get('defineStepSecondParam'));
    }
}

function getStepDefititionCallback(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder)): string {
    if (arg.type !== 'ArrowFunctionExpression') {
        throw createFormatStepsFileParsingError(arg.loc, translation.get('defineStepThirdParam'));
    }

    return generate(arg).code;
}

function getStepDefitionScopes(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder)): IScope[] {
    if (arg.type !== 'ArrayExpression') {
        throw createFormatStepsFileParsingError(arg.loc, translation.get('defineFileScopesParam'));
    }
    return getScopes(arg);
}

const wordsRegex = /[^\w\s]+/gu;
function createFunctionName(match: StepMatcher): string {
    const source = typeof (match) === 'string'
        ? match
        : match.source;
    return source.replace(wordsRegex, '')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
}

function getStepDefinition(cheminFichier: string, defineStep: CallExpression, stepBlock?: StepBlock): Omit<StepDefinition, 'imports'>[] {
    if (![2,3,4].includes(defineStep.arguments.length)) {
        throw createFormatStepsFileParsingError(defineStep.loc, translation.get('defineStepCall'));
    }
    let blocks: StepBlock[] = [stepBlock];
    if (!stepBlock) {
        blocks = getStepDefinitionBlocks(defineStep.arguments[0]);
    }
    const match = getStepDefinitionMatch(defineStep.arguments[stepBlock ? 0 : 1]);
    const functionName = createFunctionName(match);
    const callback = getStepDefititionCallback(defineStep.arguments[stepBlock ? 1 : 2]);
    const scopes = defineStep.arguments.length === 4
        ? getStepDefitionScopes(defineStep.arguments[stepBlock ? 2 : 3])
        : [];

    const fileExtension = cheminFichier.substring(cheminFichier.lastIndexOf('.') + 1);


    return blocks.map(block => ({
        index: nextStepDefinitionIndex++,
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

function removePackageImports(imports: Imports) {
    const packageImports = imports.get(packageName).filter(i => !importsToDelete.includes(i));
    if (packageImports.length === 0) {
        imports.delete(packageName);
    } else {
        imports.set(packageName, packageImports);
    }
}

function getHook(cheminFichier: string, hookCall: CallExpression): Partial<Hook> {
    const hookName = (hookCall.callee as Identifier).name;
    if (hookCall.arguments.length !== 1) {
        throw createFormatStepsFileParsingError(hookCall.loc, translation.get('hookCallParameter', { hookName }));
    }

    if (hookCall.arguments[0].type !== 'ArrowFunctionExpression') {
        throw createFormatStepsFileParsingError(hookCall.loc, translation.get('hookCallArrowFunction', { hookName }));
    }

    let code: string[];
    if (hookCall.arguments[0].body.type === 'BlockStatement') {
        code = hookCall.arguments[0].body.body.map(statement => generate(statement).code);
    } else {
        code = [generate(hookCall.arguments[0].body).code];
    }

    return {
        name: hookName as HookName,
        code: code
    };
}

function fillStepDefinitionsWithImports(stepDefinitions: Partial<StepDefinition>[], fileScopes: IScope[], imports: Imports) {
    stepDefinitions.forEach(stepDefinition => {
        stepDefinition.scopes.push(...fileScopes);

        imports.forEach((values, from, map) => {
            map.set(from, [...new Set(values)]);
        });

        stepDefinition.imports = imports;
    });
}

function fillWithScopes(scopables: { scopes?: IScope[] }[], fileScopes: IScope[]) {
    scopables.forEach(scopable => {
        scopable.scopes = fileScopes;
    });
}

type ParseOneStepDefinitionResult = Omit<ParseStepDefinitionResult, 'commonCodes'> & { commonCode?: CommonCode };

function parseOneStepFile(cheminFichier: string): ParseOneStepDefinitionResult {
    cheminFichierEnCours = cheminFichier;
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
    const commonCode: string[] = [];

    ast.program.body.forEach(x => {
        switch (x.type) {
            case 'ImportDeclaration':
                let importsValues = imports.get(x.source.value);
                if (!importsValues) {
                    importsValues = [];
                    imports.set(x.source.value, importsValues);
                }
                importsValues.push(...x.specifiers.map(specifier => specifier.local.name));
                break;
            case 'ExpressionStatement':
                if (x.expression.type !== 'CallExpression' || x.expression.callee.type !== 'Identifier') {
                    commonCode.push(generate(x).code);
                }
                else {
                    switch (x.expression.callee.name) {
                        case 'defineFileScopes':
                            if (!imports.get(packageName)?.includes('defineFileScopes')) {
                                throw createFormatStepsFileParsingError(x.loc, translation.get('defineFileScopesImport'));
                            }
                            fileScopes = getFileScopes(x.expression);
                            break;
                        case 'defineStep':
                            if (!imports.get(packageName)?.includes('defineStep')) {
                                throw createFormatStepsFileParsingError(x.loc, translation.get('defineStepImport'));
                            }
                            stepDefinitions.push(...getStepDefinition(cheminFichier, x.expression));
                            break;
                        case 'beforeAll':
                        case 'beforeEach':
                        case 'afterEach':
                        case 'afterAll':
                            hooks.push(getHook(cheminFichier, x.expression));
                            break;
                        case 'given':
                        case 'when':
                        case 'then':
                            if (!imports.get(packageName)?.includes(x.expression.callee.name)) {
                                throw createFormatStepsFileParsingError(x.loc, translation.get(`${x.expression.callee.name}Import`));
                            }
                            stepDefinitions.push(...getStepDefinition(cheminFichier, x.expression, x.expression.callee.name));
                            break;
                        default:
                            throw createFormatStepsFileParsingError(x.loc, translation.get('onlyCallsInStepdefinitionFile'));
                    }
                }
                break;
            default:
                commonCode.push(generate(x).code);
                break;
        }
    });

    let resultCommonCode: CommonCode;
    if (commonCode.length > 0) {
        resultCommonCode = {
            filename: cheminFichier,
            scopes: fileScopes,
            code: commonCode.join('\n')
        };
    }

    removePackageImports(imports);
    fillStepDefinitionsWithImports(stepDefinitions, fileScopes, imports);
    fillWithScopes(hooks, fileScopes);

    return {
        steps: stepDefinitions as StepDefinition[],
        hooks: hooks as Hook[],
        commonCode: resultCommonCode
    }
}

function findAllStepsFiles(from: fs.PathLike): string[] {
    return findAllFilesWithMatch(from, /.*\.stepdefinitions\.([tj]sx?)/);
}

function parseStepsFiles(from: fs.PathLike): ParseStepDefinitionResult {
    const parsed = findAllStepsFiles(from).map(cheminFichier => parseOneStepFile(cheminFichier));
    const hooks = parsed.flatMap(p => p.hooks);
    const steps = parsed.flatMap(p => p.steps);
    const commonCodes = parsed.map(p => p.commonCode).filter(p => Boolean(p));

    return {
        hooks,
        steps,
        commonCodes
    };
}

export { parseStepsFiles };
