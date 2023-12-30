import { parseStepsFiles } from "./parseStepsFiles";
import createSpecsFiles from "./createSpecsFiles";
import { parseFeatureFiles } from "./parseFeatureFiles";
import kleur from "kleur";
import translation from "./translation";
import { logStepTime } from "./logStepTime";
import { matchFeatureWithStepsAndHooks } from "./matchFeatureWithStepsAndHooks";

/**
 * Read .feature and .stepdefinitions.(js,ts,tsx,jsx) files,
 * match steps with those in feature files.
 * Then it creates .specs.jsx files corresponding
 * @TODO changer de fichier ne plus exporter 
 *
 * @param {string} stepsFrom The path to the folder which contains all needed stepdefinitions files.
 * @param {string} featuresFrom The path to the folder which contains all needed feature files.
 * @param {string} ignoreGenerationTag The tag to put in the .feature files you want to ignore the generation
 * @param {string} onlyGenerationTag The tag to put in the .feature files you want execute ignore all the over files
 * @param {string} ignoreExecutionTag The tag to put in the .feature files you want execute ignore the execution.
 * It must be place at Scenario location
 * @param {string} onlyExecutionTag The tag to in Feature or Scenario t
 */
export function createStepsFilesFromStepDefinitionsAndFeatures(
    stepsFrom: string,
    featuresFrom: string,
    forceStepsRegeneration: boolean,
    ignoreGenerationTag: string,
    onlyGenerationTag: string,
    ignoreExecutionTag: string,
    onlyExecutionTag: string
){
    console.log(translation.get("fileSearchInFolder", { files: kleur.yellow('features'), folder: kleur.cyan(featuresFrom)}));
    console.log(translation.get("fileSearchInFolder", { files: kleur.yellow('stepdefinitions'), folder: kleur.cyan(stepsFrom)}));
    
    let t = Date.now();
    const parseStepsResult = parseStepsFiles(stepsFrom);

    t = logStepTime(t, translation.get("parsingStepdefinitions", { nbParsed: parseStepsResult.steps.length }));

    const features = parseFeatureFiles(featuresFrom, ignoreGenerationTag, onlyGenerationTag);
    t = logStepTime(t, translation.get("parsingFeatures", { nbParsed: features.length }));
    
    const featuresWithSteps = features.map(
        ({feature, cheminFichier})=> matchFeatureWithStepsAndHooks(cheminFichier, feature, parseStepsResult, ignoreExecutionTag, onlyExecutionTag)
    );

    t = logStepTime(t, translation.get("matchingFeaturesAndSteps"));
    
    createSpecsFiles(featuresWithSteps, forceStepsRegeneration);
    logStepTime(t, translation.get("writtingSteps"));
}
