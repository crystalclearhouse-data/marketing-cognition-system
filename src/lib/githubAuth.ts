import { createAppAuth } from "@octokit/auth-app";

export async function verifyGitHubAppAuth(req: Request) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    const auth = createAppAuth({
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_PRIVATE_KEY!,
        installationId: process.env.GITHUB_INSTALLATION_ID!,
    });

    // Validate token by attempting to exchange it
    const installationAuth = await auth({
        type: "installation",
    });

    if (token !== installationAuth.token) {
        throw new Error("Invalid GitHub App token");
    }

    return true;
}
