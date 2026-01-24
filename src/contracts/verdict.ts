// This file defines the immutable contract for the Scan Engine.
// External systems (tk-22) rely on this exact shape.

export type Verdict = 'SAFE' | 'UNSAFE' | 'UNKNOWN';

export interface ScanReport {
    verdict: Verdict;
    confidence: number; // 0-100
    reasons: string[];
    recommendation: string;
    token: string;
    scan_id: string;
    timestamp: string;
}

export interface ScanRequest {
    mintAddress: string;
    // Future: forcedRefresh, analysisDepth, etc.
}
