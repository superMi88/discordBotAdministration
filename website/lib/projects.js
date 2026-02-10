import fs from 'fs';
import path from 'path';

export function getProjects() {
    const projectsPath = path.join(process.cwd(), '../projects.json');
    if (!fs.existsSync(projectsPath)) {
        return [];
    }
    const fileContent = fs.readFileSync(projectsPath, 'utf8');
    return JSON.parse(fileContent);
}
