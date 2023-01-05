import { SourceLocation } from '@babel/types';
import {
    ParsedFeature,
    ParsedScenario,
    ParsedScenarioOutline,
    ParsedStep,
  } from 'jest-cucumber/dist/src/models';
import kleur from 'kleur';
import { StepDefinition } from './common.types';

const endOfLine = '\r\n';
const lineSeparator = endOfLine + ''.padEnd(50, '-') + endOfLine;

export const formatStepsFileParsingError = (
  fichierStepDefinitions: string,
  location: SourceLocation,
  errorDetails: string
) => {
  let error = `Impossible to parse corectly in file :${endOfLine}${kleur.red(
    fichierStepDefinitions,
  )}${lineSeparator}`;
  error += `${kleur.bold(kleur.yellow('line'))}: ${location.start.line}${endOfLine}`
  error += `${kleur.bold(kleur.yellow('column'))}: ${location.start.column}${endOfLine}${lineSeparator}`;
  error += `${kleur.red(errorDetails)}${endOfLine}${lineSeparator}`;

  return error;
};

export const formatStepMatchingError = (
    fichierFeature: string,
    feature: ParsedFeature,
    scenario: ParsedScenario | ParsedScenarioOutline,
    step: ParsedStep,
    matchingStepDefinition: StepDefinition[],
  ) => {
    let error = `Impossible to bind a step in file : ${endOfLine}${kleur.red(
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
        kleur.red('No step definition have been found.'),
      )}${lineSeparator}${endOfLine}`;
      return error;
    }

    error += `${endOfLine}${kleur.bold(
      kleur.green(
        `${matchingStepDefinition.length} définitions of same step found:`,
      ),
    )}`;
    matchingStepDefinition.forEach(({ block, match, scopes, cheminFichier }) => {
      error += lineSeparator;
      error += `${kleur.bold(kleur.yellow('fichier'))}: ${cheminFichier}${endOfLine}`;
      error += `${kleur.bold(kleur.yellow('block'))}  : ${block}${endOfLine}`;
      error += `${kleur.bold(kleur.yellow('matcher'))}: ${match}${endOfLine}`;
      error += `${kleur.bold(kleur.yellow('scopes'))} : ${JSON.stringify(scopes)}`;
    });

    return error;
  };
  