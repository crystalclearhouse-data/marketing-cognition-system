import { ScanReport } from '../../contracts/verdict';

// Configuration for "Fail Closed" logic
const THRESHOLDS = {
    MIN_CONFIDENCE: 70, // Below this, we default to UNKNOWN or UNSAFE
    BLOCK_LIST: ['sus_mint_123'], // Example override
};

export async function executeScan(mint: string): Promise<ScanReport> {
    // Simulate Analysis Steps
    const analysis = await runAnalysis(mint);

    // FAIL CLOSED CHECK
    if (analysis.confidence < THRESHOLDS.MIN_CONFIDENCE) {
        return {
            verdict: 'UNKNOWN', // Safety: Don't claim SAFE if we aren't sure
            confidence: analysis.confidence,
            reasons: ['Insufficient analysis confidence', ...analysis.reasons],
            recommendation: 'MANUAL_REVIEW_REQUIRED',
            token: mint,
            scan_id: `tk22_${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
    }

    // Blocklist Check
    if (THRESHOLDS.BLOCK_LIST.includes(mint)) {
        return {
            verdict: 'UNSAFE',
            confidence: 100,
            reasons: [' explicitly blocked by local policy'],
            recommendation: 'DO_NOT_INTERACT',
            token: mint,
            scan_id: `tk22_${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
    }

    return {
        verdict: 'SAFE',
        confidence: 95,
        reasons: ['Engine reached', 'No malicious patterns found'],
        recommendation: 'STRUCTURALLY SAFE',
        token: mint,
        scan_id: `tk22_${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
}

async function runAnalysis(mint: string) {
    // MOCK: In production, this calls external scanners/AI
    // For now, we simulate a healthy scan unless the mint is "low_conf"
    if (mint === 'low_conf') {
        return { confidence: 50, reasons: ['Data providers unreachable'] };
    }
    return { confidence: 95, reasons: [] };
}
