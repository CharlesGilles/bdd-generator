import fs from 'fs';
import path from 'path';

let actualTranslation: Record<string, string> = {};
let lang = null;

function setTranslation(language: string){
    if (language === lang){
        return;
    }
    try {
        const filePath = path.join(process.cwd(), 'node_modules', '@charlesgilles', 'bdd-generator', 'lang', `${language}.json`);
        const translationFile = fs.readFileSync(filePath, 'utf8');
        actualTranslation = JSON.parse(translationFile);
        lang = language;
    } catch (err) {
        console.error(`Error while loading ${language} translation: ${err.message}`);
        return false;
    }
    return true;
}

function get(key: string, variables?: Record<string, string | number>){
    let translation =  actualTranslation[key] || key;
    if (
        key === translation
        || !variables
    ){
        return translation;
    }
    for (const variable in variables){
        translation = translation.replace(`{{${variable}}}`, variables[variable].toString());
    }
    return translation;
}

export default {
    get,
    setTranslation
};
