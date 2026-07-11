const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');

function init() {
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    let modified = false;

    // Check if JWT_SECRET exists
    if (!envContent.includes('JWT_SECRET=')) {
        const secret = crypto.randomBytes(32).toString('hex');
        const newLine = `JWT_SECRET="${secret}"\n`;

        if (envContent.length > 0 && !envContent.endsWith('\n')) {
            envContent += '\n';
        }
        envContent += newLine;
        modified = true;
        console.log('[Init] JWT_SECRET wurde zur .env hinzugefügt.');
    } else {
        console.log('[Init] JWT_SECRET bereits vorhanden.');
    }

    // Check if PORT exists
    if (!envContent.includes('PORT=')) {
        const newLine = `PORT=80\n`;

        // Reload content in case it was modified by JWT_SECRET addition above
        if (modified) {
            fs.writeFileSync(envPath, envContent);
        }
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        if (envContent.length > 0 && !envContent.endsWith('\n')) {
            envContent += '\n';
        }
        envContent += newLine;
        modified = true;
        console.log('[Init] PORT=80 wurde zur .env hinzugefügt.');
    } else {
        console.log('[Init] PORT bereits vorhanden.');
    }

    if (modified) {
        fs.writeFileSync(envPath, envContent);
    }
}

init();
