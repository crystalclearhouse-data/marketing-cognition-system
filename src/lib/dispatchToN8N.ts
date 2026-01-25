import crypto from "crypto";

type ScanResult = {
    scan_id: string;
    verdict: "SAFE" | "FAIL" | string;
    confidence: number;
    reasons: string[];
    recommendation: string;
    token: string;
    timestamp: string;
};

export async function dispatchToN8N(result: ScanResult) {
    const url = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.N8N_WEBHOOK_SECRET;

    // Fail silently: signal loss must not affect verdict integrity
    if (!url || !secret) return;

    const payload = JSON.stringify(result);

    const signature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

    try {
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Webhook-Secret": secret,
                "X-Signature": signature
            },
            body: payload
        });
    } catch {
        // Never throw
    }
}
