import { PathLike, readdirSync } from 'fs';

export function findAllFilesWithMatch(from: PathLike, regex: RegExp): string[] {
    const files: string[] = [];
    const directories = [from];

    while (directories.length !== 0){
        const directory = directories.pop();
        const results = readdirSync(directory, { withFileTypes: true });
        results.forEach(result => {
            const resultPath = `${directory}/${result.name}`;
            if (result.isFile() && regex.test(resultPath)){
                files.push(resultPath);
            }
            else if (result.isDirectory()){
                directories.push(resultPath);
            }
        });
    }

    return files;
}
