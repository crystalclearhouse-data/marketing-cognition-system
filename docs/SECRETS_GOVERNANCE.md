# Secrets Governance Policy

This document defines how secrets are created, stored, accessed, rotated, and audited across the system.

This policy is mandatory.
Violations are treated as security incidents.

---

## Core Principles

1. Secrets are never committed to source control.
2. Secrets are scoped to the minimum required privilege.
3. Secrets are owned by infrastructure, not agents.
4. Secrets are rotated regularly and on suspicion.
5. Secrets are observable but not inspectable.

---

## What Qualifies as a Secret

The following are considered secrets and are governed by this policy:

- API keys
- Private keys (RSA, ECDSA, etc.)
- OAuth client secrets
- Service role keys
- Webhook signing secrets
- Database credentials
- Encryption keys

Configuration values that are non-sensitive (URLs, IDs) are not secrets.

---

## Approved Storage Locations

Secrets may only be stored in the following locations:

### 1. GitHub Secrets
- Repository secrets
- Organization secrets
- Environment-scoped secrets

**Usage**:
- CI/CD
- GitHub Actions
- Build-time injection

**Rules**:
- Secrets stored here must never be logged or echoed
- Access is read-only at runtime
- No secrets in workflow files

---

### 2. Supabase Secrets
- Database credentials
- Service role keys
- Row-level security policies

**Rules**:
- Service role keys are server-only
- Read-only roles must never hold write privileges
- Analytics roles are isolated
- No client-side exposure

---

### 3. n8n Credentials Store
- API tokens
- Webhook secrets
- Service integrations

**Rules**:
- No secrets embedded in workflows
- Credentials referenced by ID only
- Access restricted to execution nodes
- No logging of credential values

---

### 4. Local Development (`.env`)
- Used for local testing only
- Must be gitignored
- Never shared via chat, email, or screenshots

**Local secrets are disposable**:
- Generated per-developer
- Rotated frequently
- Never promoted to production

---

## Prohibited Storage Locations

The following locations are **explicitly forbidden**:

- ❌ Git repositories (commits, branches, tags)
- ❌ Pull request descriptions
- ❌ Issue comments
- ❌ Wiki pages
- ❌ Documentation files
- ❌ Log files
- ❌ Error messages
- ❌ Client-side code
- ❌ Screenshots or recordings
- ❌ Chat messages (Slack, Discord, etc.)
- ❌ Email
- ❌ Shared documents (Google Docs, Notion)

**Detection**: Automated scanning via git-secrets, GitHub Advanced Security.

---

## Secret Lifecycle

### Creation

1. **Generate** secrets using cryptographically secure methods
2. **Scope** to minimum required privilege
3. **Document** purpose and owner in secret management system
4. **Store** in approved location only

**Naming Convention**:
```
{SERVICE}_{ENVIRONMENT}_{PURPOSE}_KEY

Examples:
- GITHUB_PROD_APP_PRIVATE_KEY
- SUPABASE_DEV_SERVICE_ROLE_KEY
- N8N_PROD_WEBHOOK_SECRET
```

---

### Access

**Who can access secrets**:
- Infrastructure owners (deployment)
- Automation systems (CI/CD)
- Service accounts (runtime)

**Who cannot access secrets**:
- Agents (Sonia, Fred)
- End users
- Analytics tools (except read-only DB credentials)

**Access is logged**: All secret retrievals are auditable.

---

### Rotation

**Mandatory rotation schedule**:

| Secret Type | Rotation Frequency |
|-------------|-------------------|
| API keys | 90 days |
| Private keys | 180 days |
| Database credentials | 90 days |
| Service role keys | 180 days |
| Webhook secrets | 90 days |

**Immediate rotation required**:
- Suspected exposure
- Employee departure
- Service compromise
- Public disclosure
- Development key in production

**Rotation procedure**:
1. Generate new secret
2. Deploy new secret to infrastructure
3. Verify system function
4. Revoke old secret
5. Document rotation in audit log

---

## Agent Secret Access

Agents (Sonia, Fred) **do not hold secrets**.

Instead:
- Agents invoke services that hold secrets
- Services authenticate agents via tokens
- Tokens are scoped and time-limited
- No agent can access raw secret values

**Example**:
```javascript
// ❌ WRONG: Agent holds secret
const apiKey = process.env.GITHUB_API_KEY;
const response = await fetch(url, { headers: { 'Authorization': apiKey }});

// ✅ CORRECT: Agent uses credential service
const token = await getGitHubToken(); // Returns scoped, temporary token
const response = await fetch(url, { headers: { 'Authorization': token }});
```

---

## Supabase Specific Rules

### Service Role Key
- **Purpose**: Server-side admin operations
- **Storage**: GitHub Secrets, n8n credentials store
- **Never**: Client-side, logs, documentation

### Anonymous Key (anon)
- **Purpose**: Client-side queries with RLS
- **Storage**: Can be public (RLS protects data)
- **Rules**: Always paired with RLS policies

### Read-Only Role
- **Purpose**: Analytics, reporting tools
- **Storage**: Separate credential store
- **Rules**: SELECT-only, no PII access

---

## GitHub App Credentials

### App ID
- **Classification**: Non-secret (public identifier)
- **Storage**: Configuration files, environment variables

### Installation ID
- **Classification**: Non-secret (public identifier)
- **Storage**: Configuration files, environment variables

### Private Key
- **Classification**: Secret (must be protected)
- **Storage**: GitHub Secrets only
- **Format**: PEM, newlines preserved
- **Rotation**: 180 days or on suspicion

---

## Incident Response

### If a Secret is Exposed

1. **Immediate Actions**:
   - Revoke the exposed secret
   - Rotate to new secret
   - Deploy new secret to infrastructure
   - Verify system function

2. **Investigation**:
   - Identify exposure vector
   - Determine exposure scope
   - Check for unauthorized access
   - Review audit logs

3. **Documentation**:
   - Create incident report
   - Document timeline
   - Identify root cause
   - Implement preventive measures

4. **Notification**:
   - Notify infrastructure owners
   - Alert affected services
   - Update security team

---

## Audit Requirements

All secret operations must be logged:

**Log on**:
- Secret creation
- Secret access
- Secret rotation
- Secret revocation
- Failed access attempts

**Logs must include**:
- Timestamp
- Actor (user/service)
- Action (create/access/rotate/revoke)
- Secret identifier (not value)
- Result (success/failure)

**Log retention**: 1 year minimum

---

## Developer Responsibilities

Developers must:

1. ✅ Store secrets in approved locations only
2. ✅ Use `.env.local` for local development
3. ✅ Add `.env.local` to `.gitignore`
4. ✅ Request scoped secrets (minimum privilege)
5. ✅ Report suspected exposure immediately
6. ✅ Rotate secrets on schedule
7. ✅ Delete local secrets when leaving project

Developers must not:

1. ❌ Commit secrets to git (ever)
2. ❌ Share secrets via chat/email
3. ❌ Embed secrets in code
4. ❌ Log secret values
5. ❌ Screenshot secrets
6. ❌ Use production secrets in development
7. ❌ Reuse secrets across services

---

## Enforcement

### Automated Checks

- **Pre-commit**: git-secrets scans for patterns
- **CI/CD**: Secret scanning in GitHub Actions
- **Runtime**: No secrets in logs or error messages

### Manual Review

- Security team reviews quarterly
- All new secrets require approval
- Rotation compliance monitored

### Violations

**Severity 1** (Critical):
- Secret committed to git
- Secret shared publicly
- Production secret in client code

**Response**: Immediate revocation, incident investigation

**Severity 2** (High):
- Secret in logs
- Unrotated secret past deadline
- Overprivileged secret

**Response**: Mandatory rotation, warning

**Severity 3** (Medium):
- Improper documentation
- Missing audit trail
- Naming convention violation

**Response**: Corrective action, education

---

## Secret Scanning Configuration

### GitHub Advanced Security

Enable for:
- All branches
- Pull requests
- Commit history

Scan for:
- API keys
- Private keys
- OAuth tokens
- Database credentials
- Generic secrets (high entropy strings)

### git-secrets (Local)

Install:
```bash
brew install git-secrets
git secrets --install
git secrets --register-aws
```

Add custom patterns:
```bash
git secrets --add 'SUPABASE_[A-Z_]+_KEY'
git secrets --add 'GITHUB_[A-Z_]+_KEY'
git secrets --add 'N8N_[A-Z_]+_SECRET'
```

---

## Exception Process

Rare cases may require deviations from this policy.

**Exception requires**:
1. Written justification
2. Security team approval
3. Compensating controls
4. Time-limited scope
5. Enhanced monitoring

**Temporary exceptions**:
- Max duration: 30 days
- Reviewed weekly
- Auto-expires

**No exceptions for**:
- Committing secrets to git
- Sharing production secrets
- Client-side secret exposure

---

## Related Documents

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [INVARIANTS.md](INVARIANTS.md) - System constraints
- [.env.example](../.env.example) - Configuration template

---

## Policy Updates

This policy is reviewed quarterly.

**Version**: 1.0.0  
**Last Updated**: 2026-01-26  
**Next Review**: 2026-04-26  
**Owner**: Infrastructure Team

**Change History**:
- 2026-01-26: Initial policy creation

---

## Summary

Secrets are infrastructure concerns, not agent concerns.

Key rules:
1. Never commit secrets
2. Store in approved locations only
3. Rotate on schedule
4. Revoke immediately on suspicion
5. Log all access

Violations are security incidents.

---

*This policy is mandatory and non-negotiable.*
