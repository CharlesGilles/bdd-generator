import { SourceLocation } from '@babel/types';
import {
    ParsedFeature,
    ParsedScenario,
    ParsedScenarioOutline,
    ParsedStep,
  } from 'jest-cucumber/dist/src/models';
import kleur from 'kleur';
import { StepDefinition } from './common.types';
import translation from './translation';

const endOfLine = '\r\n';
const lineSeparator = endOfLine + ''.padEnd(50, '-') + endOfLine;

export const formatStepsFileParsingError = (
  fichierStepDefinitions: string,
  location: SourceLocation,
  errorDetails: string
) => {
  let error = `${translation.get('impossibleParse')} :${endOfLine}${kleur.red(
    fichierStepDefinitions,
  )}${lineSeparator}`;
  error += `${kleur.bold(kleur.yellow('line'))}: ${location.start.line}${endOfLine}`
  error += `${kleur.bold(kleur.yellow('column'))}: ${location.start.column}${endOfLine}${lineSeparator}`;
  error += `${kleur.red(errorDetails)}${endOfLine}${lineSeparator}`;

  return error;
};

export const formatTwoDefaultImportsError = (
  from: string,
  defaultImport1: string,
  defaultImport2: string,
  featureSource: string,
  defaultImport2Source: string
) => {
  let error = `${translation.get('defaultImportWithMultipleNames')} :${endOfLine}${kleur.red(
    featureSource,
  )}${lineSeparator}`;
  error += `package: ${kleur.bold(kleur.yellow(from))}${endOfLine}`
  error += `import 1: ${kleur.bold(kleur.yellow(defaultImport1))}${endOfLine}`;
  error += `import 2: ${kleur.bold(kleur.yellow(defaultImport2))}, source: ${kleur.yellow(defaultImport2Source)}${endOfLine}`;

  return error;
};

export const formatStepMatchingError = (
    fichierFeature: string,
    feature: ParsedFeature,
    scenario: ParsedScenario | ParsedScenarioOutline,
    step: ParsedStep,
    matchingStepDefinition: StepDefinition[],
  ) => {
    let error = `${translation.get('impossibleBind')} : ${endOfLine}${kleur.red(
      fichierFeature,
    )}${lineSeparator}`;
    error += `${kleur.bold(kleur.yellow('feature'))} : ${feature.title}${endOfLine}`;
    error += `${kleur.bold(kleur.yellow('scenario'))}: ${scenario.title} (ligne ${
      scenario.lineNumber
    })${endOfLine}`;
    error += `${kleur.bold(kleur.yellow('step'))}    : ${step.stepText} (ligne ${
      step.lineNumber
    })${endOfLine}`;
    error += `${kleur.bold(kleur.yellow('tags'))}    : ${feature.tags.concat(scenario.tags).join()}${lineSeparator}`;

    if (!matchingStepDefinition.length) {
      error += `${endOfLine}${kleur.bold(
        kleur.red(translation.get('noStepFound')),
      )}${lineSeparator}${endOfLine}`;
      return error;
    }

    error += `${endOfLine}${kleur.bold(
      kleur.green(
        `${matchingStepDefinition.length} ${translation.get('sameStepFound')}:`,
      ),
    )}`;
    matchingStepDefinition.forEach(({ blocks, match, scopes, cheminFichier }) => {
      error += lineSeparator;
      error += `${kleur.bold(kleur.yellow('fichier'))}: ${cheminFichier}${endOfLine}`;
      error += `${kleur.bold(kleur.yellow('blocks'))}  : ${blocks.join(', ')}${endOfLine}`;
      error += `${kleur.bold(kleur.yellow('matcher'))}: ${match}${endOfLine}`;
      error += `${kleur.bold(kleur.yellow('scopes'))} : ${JSON.stringify(scopes)}`;
    });

    return error;
  };
  