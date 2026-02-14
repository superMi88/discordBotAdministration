import { getProjects } from '@/lib/projects';

export default function handler(req, res) {
    if (req.method === 'GET') {
        const projects = getProjects();
        res.status(200).json(projects);
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
