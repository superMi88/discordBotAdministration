import fs from 'fs';
import path from 'path';

function getDatabaseName(url) {
    if (!url) return 'LiasDatabase';
    try {
        const parsed = new URL(url);
        const name = parsed.pathname.replace(/^\//, '');
        return name || 'LiasDatabase';
    } catch (e) {
        return 'LiasDatabase';
    }
}

export function getProjects() {
    const projectsPath = path.join(process.cwd(), '../projects.json');
    if (fs.existsSync(projectsPath)) {
        try {
            const fileProjects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
            if (Array.isArray(fileProjects) && fileProjects.length > 0) {
                return fileProjects;
            }
        } catch (e) {}
    }

    const dbName = process.env.DATABASE_NAME || getDatabaseName(process.env.DATABASE_URL) || 'LiasDatabase';
    return [
        {
            name: dbName,
            alias: process.env.PROJECT_ALIAS || dbName,
            description: 'Hauptdatenbank Lias Bot'
        }
    ];
}
