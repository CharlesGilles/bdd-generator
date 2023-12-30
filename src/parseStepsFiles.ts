import * as fs from 'fs';
import { parse as parseFile } from '@babel/parser';
import { ArgumentPlaceholder, ArrayExpression, CallExpression, Expression, Identifier, JSXNamespacedName, ObjectExpression, SourceLocation, SpreadElement, Statement, VariableDeclaration } from '@babel/types';
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
        return new RegExp(arg.pattern, arg.flags);
    } else if (arg.type === 'StringLiteral') {
        return arg.value;
    } else {
        throw createFormatStepsFileParsingError(arg.loc, translation.get('defineStepSecondParam'));
    }
}

function getStepDefititionCallback(arg: (Expression | SpreadElement | JSXNamespacedName | ArgumentPlaceholder), usableFunctionsForSteps: string[]): string {
    if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
        return generate(arg).code;
    }
    if (arg.type === 'Identifier'){
        if (usableFunctionsForSteps.includes(arg.name)) {
            return arg.name;
        }
        else {
            throw createFormatStepsFileParsingError(arg.loc, translation.get('defineStepThirdParamWrongIdentifier'));
        }
    }
    throw createFormatStepsFileParsingError(arg.loc, translation.get('defineStepThirdParam'));
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

function getStepDefinition(usableFunctionsForSteps: string[], defineStep: CallExpression, stepBlock?: StepBlock): Omit<StepDefinition, 'imports'>[] {
    if (![2,3,4].includes(defineStep.arguments.length)) {
        throw createFormatStepsFileParsingError(defineStep.loc, translation.get('defineStepCall'));
    }
    let blocks: StepBlock[] = [stepBlock];
    if (!stepBlock) {
        blocks = getStepDefinitionBlocks(defineStep.arguments[0]);
    }
    const match = getStepDefinitionMatch(defineStep.arguments[stepBlock ? 0 : 1]);
    const functionName = createFunctionName(match);
    const callback = getStepDefititionCallback(defineStep.arguments[stepBlock ? 1 : 2], usableFunctionsForSteps);
    const scopes = defineStep.arguments.length === 4
        ? getStepDefitionScopes(defineStep.arguments[stepBlock ? 2 : 3])
        : [];

    const fileExtension = cheminFichierEnCours.substring(cheminFichierEnCours.lastIndexOf('.') + 1);


    return blocks.map(block => ({
        index: nextStepDefinitionIndex++,
        block,
        match,
        callback,
        scopes,
        functionName,
        cheminFichier: cheminFichierEnCours,
        fileExtension: {
            jsx: fileExtension.endsWith('x'),
            ts: fileExtension.startsWith('t')
        }
    }));
}

function removePackageImports(imports: Imports) {
    const bddGeneratorImports = imports.get(packageName);  
    const nammedImports = bddGeneratorImports.nammedImports.filter(i => !importsToDelete.includes(i));
    if (nammedImports.length === 0) {
        imports.delete(packageName);
    } else {
        imports.set(packageName, { nammedImports, sourceFile: bddGeneratorImports.sourceFile });
    }
}

function getHook(hookCall: CallExpression): Partial<Hook> {
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

        imports.forEach(({sourceFile, nammedImports }, from, map) => {
            map.set(from, { sourceFile, nammedImports: [...new Set(nammedImports)] });
        });

        stepDefinition.imports = imports;
    });
}

function fillWithScopes(scopables: { scopes?: IScope[] }[], fileScopes: IScope[]) {
    scopables.forEach(scopable => {
        scopable.scopes = fileScopes;
    });
}

function isFunctionDeclaration(x: VariableDeclaration) {
    return x.declarations.length === 1
        && x.declarations[0].type === 'VariableDeclarator'
        && x.declarations[0].id.type === 'Identifier'
        && (
            x.declarations[0].init.type === 'ArrowFunctionExpression'
            || x.declarations[0].init.type === 'FunctionExpression'
        );
}

function pushCommonCode(rootCommonCode: string[], commonCodeWithScenarioContext: string[], x: Statement){
    const code = generate(x).code;
    if (code.includes('scenarioContext')) {
        commonCodeWithScenarioContext.push(code);
    } else {
        rootCommonCode.push(code);
    }
}

type ParseOneStepDefinitionResult = Omit<ParseStepDefinitionResult, 'rootCommonCodes' | 'commonCodesWithScenarioContext'> 
    & { rootCommonCode: CommonCode, commonCodeWithScenarioContext: CommonCode };

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
    const imports: Imports = new Map<string, { nammedImports: string[]; sourceFile: string }>();
    const stepDefinitions: Partial<StepDefinition>[] = [];
    const hooks: Partial<Hook>[] = [];
    const rootCommonCode: string[] = [];
    const commonCodeWithScenarioContext: string[] = [];
    const usableFunctionsForSteps: string[] = [];

    ast.program.body.forEach(x => {
        switch (x.type) {
            case 'ImportDeclaration':
                let nammedImports = imports.get(x.source.value)?.nammedImports;
                if (!nammedImports) {
                    nammedImports = [];
                    imports.set(x.source.value, { sourceFile: cheminFichier, nammedImports });
                }
                nammedImports.push(...x.specifiers.map(specifier => specifier.local.name));
                break;
            case 'VariableDeclaration':
                if (isFunctionDeclaration(x)) {   
                    usableFunctionsForSteps.push((x.declarations[0].id as Identifier).name);
                }
                pushCommonCode(rootCommonCode, commonCodeWithScenarioContext, x);
                break;
            case 'ExpressionStatement':
                if (x.expression.type !== 'CallExpression' || x.expression.callee.type !== 'Identifier') {
                    pushCommonCode(rootCommonCode, commonCodeWithScenarioContext, x);
                    break;
                }
                switch (x.expression.callee.name) {
                    case 'defineFileScopes':
                        if (!imports.get(packageName)?.nammedImports?.includes('defineFileScopes')) {
                            throw createFormatStepsFileParsingError(x.loc, translation.get('defineFileScopesImport'));
                        }
                        fileScopes = getFileScopes(x.expression);
                        break;
                    case 'defineStep':
                        if (!imports.get(packageName)?.nammedImports?.includes('defineStep')) {
                            throw createFormatStepsFileParsingError(x.loc, translation.get('defineStepImport'));
                        }
                        stepDefinitions.push(...getStepDefinition(usableFunctionsForSteps, x.expression));
                        break;
                    case 'beforeAll':
                    case 'beforeEach':
                    case 'afterEach':
                    case 'afterAll':
                        hooks.push(getHook(x.expression));
                        break;
                    case 'given':
                    case 'when':
                    case 'then':
                        if (!imports.get(packageName)?.nammedImports?.includes(x.expression.callee.name)) {
                            throw createFormatStepsFileParsingError(x.loc, translation.get(`${x.expression.callee.name}Import`));
                        }
                        stepDefinitions.push(...getStepDefinition(usableFunctionsForSteps, x.expression, x.expression.callee.name));
                        break;
                    default:
                        throw createFormatStepsFileParsingError(x.loc, translation.get('onlyCallsInStepdefinitionFile'));
                }
                break;
            default:
                pushCommonCode(rootCommonCode, commonCodeWithScenarioContext, x);
                break;
        }
    });

    const resultRootCommonCode = formatCommonCode(rootCommonCode, cheminFichier, fileScopes);
    const resultCommonCodeWithScenarioContext = formatCommonCode(commonCodeWithScenarioContext, cheminFichier, fileScopes);

    removePackageImports(imports);
    fillStepDefinitionsWithImports(stepDefinitions, fileScopes, imports);
    fillWithScopes(hooks, fileScopes);

    return {
        steps: stepDefinitions as StepDefinition[],
        hooks: hooks as Hook[],
        rootCommonCode: resultRootCommonCode,
        commonCodeWithScenarioContext: resultCommonCodeWithScenarioContext
    }
}

function formatCommonCode(rootCommonCode: string[], cheminFichier: string, fileScopes: IScope[]) {
    let resultCommonCode: CommonCode;
    if (rootCommonCode.length > 0) {
        resultCommonCode = {
            filename: cheminFichier,
            scopes: fileScopes,
            code: rootCommonCode.join('\n')
        };
    }
    return resultCommonCode;
}

function findAllStepsFiles(from: fs.PathLike): string[] {
    return findAllFilesWithMatch(from, /.*\.stepdefinitions\.([tj]sx?)/);
}

function parseStepsFiles(from: fs.PathLike): ParseStepDefinitionResult {
    const parsed = findAllStepsFiles(from).map(cheminFichier => parseOneStepFile(cheminFichier));
    const hooks = parsed.flatMap(p => p.hooks);
    const steps = parsed.flatMap(p => p.steps);
    const rootCommonCodes = parsed.map(p => p.rootCommonCode).filter(p => Boolean(p));
    const commonCodesWithScenarioContext = parsed.map(p => p.commonCodeWithScenarioContext).filter(p => Boolean(p));

    return {
        hooks,
        steps,
        rootCommonCodes,
        commonCodesWithScenarioContext
    };
}

export { parseStepsFiles };
