type StepMatcher = string | RegExp;

type StepBlock = 'given' | 'when' | 'then'; 

type Imports = Map<string, string[]>;

interface IScope {
    feature?: string;
    scenario?: string;
    tag?: string;
}

interface StepFunction {
    block: StepBlock;
    functionName: string;
}

interface Scenario {
    nom: string;
    stepsFunctions: StepFunction[];
}

type HookName = 'beforeAll' | 'beforeEach' | 'afterAll' | 'afterEach';

interface Hook {
    scopes: IScope[];
    name: HookName;
    code: string[];
}

interface ParseStepDefinitionResult {
    steps: StepDefinition[];
    hooks: Hook[];
}

interface FileExtension {
    ts: boolean;
    jsx: boolean;
} 

interface StepDefinition {
    block: StepBlock;
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
    steps: StepDefinition[];
    hooks: Hook[];
    extension: 'js' | 'ts' | 'jsx' | 'tsx'
}

export type { Hook, ParseStepDefinitionResult, StepMatcher, StepBlock, Imports, IScope, Scenario, Feature, StepDefinition, HookName };
