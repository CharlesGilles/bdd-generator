import { loadFeature } from "jest-cucumber";
import { ParsedFeature } from 'jest-cucumber/dist/src/models';
import { findAllFilesWithMatch } from "./findAllFilesWithMatch";
import translation from "./translation";

type ParsedFeatureWithFilename = {
    feature: ParsedFeature;
    cheminFichier: string;
}

function parseFeatureFiles(
    from: string,
    ignoreGenerationTag: string,
    onlyGenerationTag: string,
) {
    const featureFilenames = findAllFilesWithMatch(from, /.*\.feature$/);

    const parsedFeatures: ParsedFeatureWithFilename[] = [];
    let nbSkipped = 0;

    featureFilenames.forEach(cheminFichier => {
        const feature = loadFeature(cheminFichier, {
            loadRelativePath: false,
            errors: true
        });
        if (feature.tags.includes(ignoreGenerationTag)){
            nbSkipped++;
            return;
        }
        parsedFeatures.push({ feature, cheminFichier });
    });

    console.info(translation.get('ignoredGeneration', { ignoreGenerationTag, nbSkipped }));

    const featuresWithOnlyTag = parsedFeatures.filter(parsedFeature => parsedFeature.feature.tags.includes(onlyGenerationTag));

    if (featuresWithOnlyTag.length !== 0){
        console.info(translation.get('onlyGeneration', { onlyGenerationTag, nbFiles: featuresWithOnlyTag.length }));
        return featuresWithOnlyTag;
    }
    return parsedFeatures;
}

export { parseFeatureFiles };
