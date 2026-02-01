# Sonia Agent - Quick Reference

## Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure credentials
cp .env.example .env.local
# Edit .env.local with your GitHub App credentials
```

## Basic Usage

```bash
# Run the agent
npm run sonia

# Or run directly
node sonia.agent.js
```

## Output Files

After execution, check these files:

1. **`SONIA_STATUS.md`** - Human-readable status report
2. **`.sonia/sonia-findings.json`** - Detailed findings in JSON format  
3. **`.sonia/github-proposals.json`** - Proposed GitHub issues (dry-run)

## Understanding the Report

### Health Score
- **100**: Perfect health, no issues detected
- **90-99**: Minor warnings present
- **<90**: Structural errors detected

### Severity Levels
- **error**: Critical issues requiring immediate attention
- **warning**: Non-critical issues that should be addressed
- **info**: Informational findings (TODOs, tasks)

## Common Commands

```bash
# Run agent and view report
npm run sonia && cat SONIA_STATUS.md

# View findings as JSON
cat .sonia/sonia-findings.json | jq .

# Check health score only
npm run sonia | grep "Health Score"

# View proposed issues
cat .sonia/github-proposals.json | jq .
```

## Integration with CI/CD

### GitHub Actions (Automated)
The workflow is already configured in `.github/workflows/sonia-scan.yml`

Triggers:
- ✅ Push to main branch
- ✅ Pull requests
- ✅ Weekly schedule (Monday midnight UTC)
- ✅ Manual trigger via GitHub UI

### Manual Webhook
Set up a webhook receiver that triggers:
```bash
npm run sonia
```

## Configuration Options

### Disable GitHub Integration
```bash
ENABLE_GITHUB=false npm run sonia
```

### Enable Claude API Analysis
```bash
CLAUDE_API_KEY=your-key npm run sonia
```

### Enable Supabase Logging
```bash
SUPABASE_URL=your-url SUPABASE_KEY=your-key npm run sonia
```

## Troubleshooting

### "GitHub credentials not found"
- Create `.env.local` with GitHub App credentials
- Or disable GitHub: `ENABLE_GITHUB=false npm run sonia`

### "Module not found"
- Run `npm install` to install dependencies

### Tests failing
- Run `npm test` to see which tests are failing
- Check that all dependencies are installed

## API Reference

### RepositoryScanner
Scans repository for:
- Missing directories/files
- TODO/FIXME comments
- Unchecked tasks in markdown
- Git activity signals

### GitHubIntegration
- Authenticates with GitHub App
- Proposes issues based on findings
- Requires human approval before creating

### StatusReportGenerator
Generates markdown report with:
- Health metrics
- Structural findings
- Tasks & TODOs
- Activity signals

## Examples

### Example 1: Basic Scan
```bash
$ npm run sonia
[SONIA INFO] === SONIA AGENT STARTING ===
[SONIA ✓] Repository scan complete
Health Score: 100/100
```

### Example 2: With GitHub Integration
```bash
$ npm run sonia
[SONIA ✓] GitHub authentication successful
[SONIA INFO] Proposed GitHub Issue: [SONIA] MISSING FILE...
[SONIA INFO] Note: Issues NOT created automatically
```

### Example 3: Checking Specific Findings
```bash
# Get all TODOs
cat .sonia/sonia-findings.json | jq '.tasks[] | select(.type=="code_todo")'

# Get health metrics
cat .sonia/sonia-findings.json | jq '.metrics'

# Count unchecked tasks
cat .sonia/sonia-findings.json | jq '.tasks | length'
```

## Best Practices

1. **Run regularly**: Set up the GitHub Action or run weekly
2. **Review findings**: Don't ignore warnings and info items
3. **Address errors**: Fix structural errors promptly
4. **Clean TODOs**: Either complete or remove stale TODOs
5. **Track progress**: Monitor health score trends over time

## Support

- **Documentation**: See [docs/SONIA_AGENT.md](../docs/SONIA_AGENT.md)
- **Issues**: Report bugs on GitHub
- **Tests**: Run `npm test` to validate functionality

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-26
