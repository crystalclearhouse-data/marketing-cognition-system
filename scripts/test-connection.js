const fs = require('fs');
const path = require('path');
const { createAppAuth } = require("@octokit/auth-app");

async function run() {
    console.log("1. Loading credentials...");

    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error("❌ .env.local not found!");
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');

    // Robust manual parsing
    const getEnvValue = (key) => {
        const simpleMatch = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
        if (simpleMatch) return simpleMatch[1].trim();
        return null;
    };

    const getMultilineValue = (key) => {
        const simpleMatch = envContent.match(new RegExp(`^${key}="([\\s\\S]*?)"`, 'm'));
        if (simpleMatch) return simpleMatch[1];
        return null;
    };

    const appId = getEnvValue('GITHUB_APP_ID');
    const installationId = getEnvValue('GITHUB_INSTALLATION_ID');
    const privateKey = getMultilineValue('GITHUB_PRIVATE_KEY');

    console.log(`   App ID: ${appId}`);
    console.log(`   Installation ID: ${installationId}`);
    console.log(`   Private Key found: ${!!privateKey}`);

    if (!appId || !installationId || !privateKey) {
        console.error("❌ Missing one or more credentials in .env.local");
        process.exit(1);
    }

    // 2. Authenticate
    console.log("\n2. Attempting to authenticate with GitHub...");
    try {
        const auth = createAppAuth({
            appId,
            privateKey,
            installationId,
        });

        const installationAuthentication = await auth({ type: "installation" });

        console.log("✅ Authentication successful!");
        console.log(`   Token type: ${installationAuthentication.tokenType}`);

        // 3. Verify with a real API call
        console.log("\n3. Verifying API access (fetching installation repositories)...");

        const response = await fetch("https://api.github.com/installation/repositories", {
            headers: {
                "Authorization": `Bearer ${installationAuthentication.token}`,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "marketing-cognition-system-verify"
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ API Call Successful!`);
            console.log(`   Repositories accessible: ${data.total_count}`);
            if (data.repositories && data.repositories.length > 0) {
                console.log(`   First Repo: ${data.repositories[0].name}`);
            }
            console.log("\n🎉 CONGRATULATIONS! Your GitHub App connection is fully working.");
        } else {
            console.error(`❌ API Call Failed: ${response.status} ${response.statusText}`);
            const err = await response.text();
            console.error(err);
        }

    } catch (error) {
        console.error("❌ Authentication Failed:");
        console.error(error.message);
    }
}

run();
