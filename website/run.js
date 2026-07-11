const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let port = '80'; // Default port

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const portMatch = envContent.match(/^PORT\s*=\s*["']?(\d+)["']?/m);
    if (portMatch) {
        port = portMatch[1];
    }
}

const command = process.argv[2] === 'dev' ? 'dev' : 'start';

console.log(`[Start/Dev-Runner] Starte Next.js im '${command}'-Modus auf Port ${port}...`);

const nextProcess = spawn('npx', ['next', command, '-p', port], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
});

nextProcess.on('close', (code) => {
    process.exit(code);
});
