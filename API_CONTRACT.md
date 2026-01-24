# DW-Agent-Core API Contract

**Version**: 1.0.0
**Status**: FROZEN
**Integration**: `tk-22` (Consumer) -> `marketing-cognition-system` (Provider)

## Authentication
**Mechanism**: GitHub App Installation Token
**Header**: `Authorization: Bearer <ghs_...>`
**Failure**: `401 Unauthorized`

## Endpoints

### `POST /api/scan`

**Purpose**: Execute a structural safety scan on a given Mint Address.

#### Request Schema
```json
{
  "mintAddress": "string"
}
```

#### Response Schema (Success 200)
```json
{
  "verdict": "SAFE" | "UNSAFE" | "UNKNOWN",
  "confidence": number, // 0-100
  "reasons": ["string"],
  "recommendation": "string",
  "token": "string", // Input mint address
  "scan_id": "string",
  "timestamp": "ISO8601"
}
```

#### Response Schema (Error)
```json
{
  "error": "string",
  "message": "string" // Optional detail
}
```

## Logic Guarantees
1.  **Fail Closed**: If `confidence < 70`, Verdict is `UNKNOWN` or `UNSAFE`.
2.  **Auth Strict**: No token, no service.
3.  **Timestamped**: Every verdict is strictly bound to a `scan_id` and time.

## TypeScript Interface
See `src/contracts/verdict.ts` for the source of truth type definitions.
