import crypto from "crypto"
import fs from "fs"
import { Feature } from "./common.types";

const writeFileOptions: fs.WriteFileOptions = {
    encoding: 'utf-8'
};

export type Hash = {
    commonCodes?: string,
    hooks?: string
    steps?: string
    scenarios?: string
    tags?: string
    imports?: string
}

export function GenerateHashes(feature: Feature) {
    const commonCodes = generateMd5Hash(feature.commonCodes.join(''));
    const hooksCodes = generateMd5Hash(feature.hooks.map(hook => hook.code.join('')).join(''));
    const steps = generateMd5Hash(feature.steps.map(step => step.functionName).join(''));
    const scenarios = generateMd5Hash(feature.scenarios.map(scenario => scenario.nom).join(''));
    const tags = generateMd5Hash(feature.tags.join(''));
    const imports = generateMd5Hash([...feature.imports].join(''));
    return { commonCodes, hooksCodes, steps, scenarios, tags, imports };
}

function writeFileCallback(error: NodeJS.ErrnoException | null) {
    if (error) {
        console.log(error);
    }
}

export function generateMd5Hash(input: string): string {
    return crypto.createHash('md5').update(input).digest("hex")
}

export function createHashFile(hash: Record<string, Hash>) {
    const filePath = `bdd-generator.hash.json`;
    fs.writeFile(filePath, JSON.stringify(hash), writeFileOptions, writeFileCallback);
}

export function getHashFromFile(): Record<string, Hash> {
    const filePath = `bdd-generator.hash.json`;
    if (!fs.existsSync(filePath)) {
        return {};
    }
    const hashFile = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(hashFile);
}
