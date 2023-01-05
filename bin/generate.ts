#! /usr/bin/env node
import { createStepsFilesFromStepDefinitionsAndFeatures } from "../src";

createStepsFilesFromStepDefinitionsAndFeatures('./src/__features__', './src/__features__');