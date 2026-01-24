const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('Checking .env.local at:', envPath);

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const env = {};

    lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    });

    console.log('App ID:', env['GITHUB_APP_ID']);
    console.log('Installation ID:', env['GITHUB_INSTALLATION_ID']);

    const privateKey = env['GITHUB_PRIVATE_KEY'];
    if (!privateKey) {
        console.error('❌ GITHUB_PRIVATE_KEY is missing.');
    } else {
        console.log('Private Key found. Length:', privateKey.length);
        if (privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
            console.log('✅ Private Key has correct header.');
        } else {
            console.error('❌ Private Key DOES NOT have correct header. It starts with:', privateKey.substring(0, 20) + '...');
            if (privateKey.includes('SHA256')) {
                console.error('⚠️  It looks like you pasted a SHA256 fingerprint instead of the actual key.');
            }
        }
    }

} catch (err) {
    console.error('Error reading .env.local:', err.message);
}
