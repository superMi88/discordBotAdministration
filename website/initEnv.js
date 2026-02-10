const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');

function init() {
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if JWT_SECRET exists
    if (!envContent.includes('JWT_SECRET=')) {
        const secret = crypto.randomBytes(32).toString('hex');
        const newLine = `JWT_SECRET="${secret}"\n`;

        if (envContent.length > 0 && !envContent.endsWith('\n')) {
            envContent += '\n';
        }
        envContent += newLine;

        fs.writeFileSync(envPath, envContent);
        console.log('[Init] JWT_SECRET wurde zur .env hinzugefügt.');
    } else {
        console.log('[Init] JWT_SECRET bereits vorhanden.');
    }
}

init();
