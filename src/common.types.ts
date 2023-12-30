type StepMatcher = string | RegExp;

type StepBlock = 'given' | 'when' | 'then'; 

type Imports = Map<string, {
    nammedImports: string[];
    sourceFile: string;
}>;

interface IScope {
    feature?: string;
    scenario?: string;
    tag?: string;
}

interface StepFunction {
    block: StepBlock;
    functionName: string;
}

enum ExecutionType {
    CLASSIC,
    IGNORE,
    ONLY
};

interface Scenario {
    nom: string;
    stepsFunctions: StepFunction[];
    executionType: ExecutionType;
}

type HookName = 'beforeAll' | 'beforeEach' | 'afterAll' | 'afterEach';

interface Hook {
    scopes: IScope[];
    name: HookName;
    code: string[];
}

interface CommonCode {
    scopes: IScope[];
    code: string;
    filename: string;
}

interface ParseStepDefinitionResult {
    steps: StepDefinition[];
    hooks: Hook[];
    rootCommonCodes: CommonCode[];
    commonCodesWithScenarioContext: CommonCode[];
}

interface FileExtension {
    ts: boolean;
    jsx: boolean;
} 

interface StepDefinition {
    index: number;
    blocks: StepBlock[];
    match: StepMatcher;
    callback: string;
    scopes: IScope[];
    imports: Imports;
    functionName: string;
    cheminFichier: string;
    fileExtension: FileExtension;
}

interface Feature {
    nom: string;
    cheminFichier: string;
    tags: string[];
    scenarios: Scenario[];
    imports: Imports;
    rootCommonCodes: CommonCode[];
    commonCodesWithScenarioContext: CommonCode[];
    hooks: Hook[];
    steps: StepDefinition[];
    extension: 'js' | 'ts' | 'jsx' | 'tsx'
}

export type { Hook, ParseStepDefinitionResult, StepMatcher, StepBlock, Imports, IScope, Scenario, Feature, StepDefinition, HookName, CommonCode };
export { ExecutionType };
