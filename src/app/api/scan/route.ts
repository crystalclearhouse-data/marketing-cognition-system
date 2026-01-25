export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { executeScan } from '../../scanEngine';
import { verifyGitHubAppAuth } from "@/lib/githubAuth";
import { dispatchToN8N } from "@/lib/dispatchToN8N";
import { ScanRequest } from '../../../contracts/verdict';

export async function POST(req: Request) {
    try {
        // 1. Security Barrier (Fail Closed)
        await verifyGitHubAppAuth(req);

        // 2. Input Validation
        const body = await req.json().catch(() => ({}));
        const { mintAddress } = body as ScanRequest;

        if (!mintAddress || typeof mintAddress !== 'string') {
            return NextResponse.json(
                { error: 'Invalid Request', message: 'mintAddress is required and must be a string' },
                { status: 400 }
            );
        }

        // 3. Execution
        const result = await executeScan(mintAddress);

        // 4. Dispatch Signal (Fire-and-forget)
        dispatchToN8N({
            scan_id: result.scan_id,
            verdict: result.verdict,
            confidence: result.confidence,
            reasons: result.reasons,
            recommendation: result.recommendation,
            token: result.token,
            timestamp: new Date().toISOString()
        }).catch(() => { });

        return NextResponse.json(result);

    } catch (error: any) {
        // 4. Secure Error Handling
        // If verifyGitHubAppAuth throws, we catch it here.
        const errorMessage = error instanceof Error ? error.message : "Unknown Error";

        // Explicit 401 for Auth failures
        if (errorMessage.includes("Missing Authorization") || errorMessage.includes("Invalid GitHub")) {
            return NextResponse.json(
                { error: "Unauthorized", message: errorMessage },
                { status: 401 }
            );
        }

        console.error("API Scan Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", scan_id: "err_" + Date.now() },
            { status: 500 }
        );
    }
}
