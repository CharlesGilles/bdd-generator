import kleur from "kleur";
import translation from "./translation";

export function logStepTime(begin: number, label: string, extra?: string) {
    const now = Date.now();
    const nbMs = now - begin;
    const executionTime = nbMs > 1000
        ? (nbMs / 1000).toPrecision(3) + ' ' + translation.get('seconds')
        : nbMs.toFixed(2) + ' ' + translation.get('miliseconds');
    let toLog = `${translation.get('executionTime')} "${kleur.yellow(label)}": ${kleur.bold(executionTime)}`;
    if (extra) {
        toLog += ' ' + kleur.cyan(extra);
    }
    console.log(toLog);

    return now;
}
