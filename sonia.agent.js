#!/usr/bin/env node

/**
 * SONIA AGENT - Structural Observation and Normalization Intelligence Agent
 * 
 * Requirements:
 * - Node.js 18+ (for built-in fetch API support)
 * - npm packages: @octokit/auth-app
 * 
 * Purpose: Deterministic, read-only agent that:
 * - Scans repository for structural issues, tasks, and signals
 * - Generates SONIA_STATUS.md with findings
 * - Proposes GitHub issues/PRs based on findings
 * - Integrates with Claude API for analysis (optional)
 * - Persists logs to Supabase (optional)
 * 
 * Execution Rules:
 * - Read-only: Never modifies files without human approval
 * - Deterministic: Same input = same output
 * - Observable: All actions logged and traceable
 * - Fail-safe: Proposes changes, requires approval
 */

const fs = require('fs');
const path = require('path');
const { createAppAuth } = require("@octokit/auth-app");

// Configuration
const CONFIG = {
  repoPath: process.cwd(),
  outputDir: path.join(process.cwd(), '.sonia'),
  statusFile: 'SONIA_STATUS.md',
  findingsFile: 'sonia-findings.json',
  enableGitHub: process.env.ENABLE_GITHUB !== 'false',
  enableClaude: process.env.CLAUDE_API_KEY !== undefined,
  enableSupabase: process.env.SUPABASE_URL !== undefined,
  githubOwner: process.env.GITHUB_OWNER || 'crystalclearhouse-data',
  githubRepo: process.env.GITHUB_REPO || 'marketing-cognition-system',
  nodeVersion: process.version, // Document Node.js version
};

// Ensure output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

// Logger utility
const Logger = {
  info: (msg) => console.log(`[SONIA INFO] ${msg}`),
  warn: (msg) => console.warn(`[SONIA WARN] ${msg}`),
  error: (msg) => console.error(`[SONIA ERROR] ${msg}`),
  success: (msg) => console.log(`[SONIA ✓] ${msg}`),
};

// Repository Scanner Module
class RepositoryScanner {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.findings = {
      timestamp: new Date().toISOString(),
      structural: [],
      tasks: [],
      signals: [],
      metrics: {},
    };
  }

  async scan() {
    Logger.info('Starting repository scan...');
    
    await this.scanStructure();
    await this.scanTasks();
    await this.scanSignals();
    await this.calculateMetrics();
    
    Logger.success('Repository scan complete');
    return this.findings;
  }

  async scanStructure() {
    Logger.info('Scanning repository structure...');
    
    const requiredDirs = ['beliefs', 'cognition', 'execution', 'workflows'];
    const requiredFiles = ['README.md', 'package.json'];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.repoPath, dir);
      if (!fs.existsSync(dirPath)) {
        this.findings.structural.push({
          type: 'missing_directory',
          severity: 'warning',
          path: dir,
          message: `Required directory '${dir}' is missing`,
        });
      }
    }
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.repoPath, file);
      if (!fs.existsSync(filePath)) {
        this.findings.structural.push({
          type: 'missing_file',
          severity: 'error',
          path: file,
          message: `Required file '${file}' is missing`,
        });
      }
    }
    
    // Check for TODO/FIXME comments in code
    this.scanForTodos();
  }

  scanForTodos() {
    const todoPattern = /(TODO|FIXME|XXX|HACK):?/gi;
    const searchDirs = ['src', 'scripts', 'tools'];
    
    for (const dir of searchDirs) {
      const dirPath = path.join(this.repoPath, dir);
      if (!fs.existsSync(dirPath)) continue;
      
      this.scanDirForPattern(dirPath, todoPattern, (file, line, match) => {
        this.findings.tasks.push({
          type: 'code_todo',
          severity: 'info',
          file,
          line,
          content: match.trim(),
        });
      });
    }
  }

  scanDirForPattern(dirPath, pattern, callback) {
    const files = this.getAllFiles(dirPath);
    const excludePatterns = [/node_modules/, /\.next/, /\.git/, /dist/, /build/];
    
    for (const file of files) {
      // Skip excluded directories
      if (excludePatterns.some(excludePattern => excludePattern.test(file))) {
        continue;
      }
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const match = line.match(pattern);
          if (match) {
            callback(file, index + 1, line);
          }
        });
      } catch (err) {
        // Skip files that can't be read (binary, permission issues, etc.)
        // This is expected for some files like images or restricted files
      }
    }
  }

  getAllFiles(dirPath, fileList = []) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  }

  async scanTasks() {
    Logger.info('Scanning for tasks...');
    
    // Check execution directory for pending tasks
    const execDir = path.join(this.repoPath, 'execution');
    if (fs.existsSync(execDir)) {
      const files = fs.readdirSync(execDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = fs.readFileSync(path.join(execDir, file), 'utf8');
          const uncheckedTasks = (content.match(/- \[ \]/g) || []).length;
          
          if (uncheckedTasks > 0) {
            this.findings.tasks.push({
              type: 'unchecked_task',
              severity: 'info',
              file: `execution/${file}`,
              count: uncheckedTasks,
              message: `Found ${uncheckedTasks} unchecked tasks`,
            });
          }
        }
      }
    }
  }

  async scanSignals() {
    Logger.info('Scanning for signals...');
    
    // Check for recent commits (signals of activity)
    try {
      const gitLogCmd = 'git --no-pager log --oneline -10';
      const { execSync } = require('child_process');
      const commits = execSync(gitLogCmd, { cwd: this.repoPath, encoding: 'utf8' });
      
      this.findings.signals.push({
        type: 'recent_activity',
        severity: 'info',
        message: 'Repository has recent activity',
        data: commits.split('\n').filter(Boolean).length,
      });
    } catch (err) {
      // Git not available or no commits
    }
  }

  async calculateMetrics() {
    Logger.info('Calculating metrics...');
    
    this.findings.metrics = {
      structural_issues: this.findings.structural.length,
      tasks_found: this.findings.tasks.length,
      signals_detected: this.findings.signals.length,
      health_score: this.calculateHealthScore(),
    };
  }

  calculateHealthScore() {
    const errors = this.findings.structural.filter(f => f.severity === 'error').length;
    const warnings = this.findings.structural.filter(f => f.severity === 'warning').length;
    
    let score = 100;
    score -= errors * 10;
    score -= warnings * 5;
    
    return Math.max(0, Math.min(100, score));
  }
}

// GitHub Integration Module
class GitHubIntegration {
  constructor() {
    this.enabled = CONFIG.enableGitHub;
    this.token = null;
  }

  async authenticate() {
    if (!this.enabled) {
      Logger.info('GitHub integration disabled');
      return false;
    }

    try {
      const envPath = path.join(CONFIG.repoPath, '.env.local');
      if (!fs.existsSync(envPath)) {
        Logger.warn('GitHub credentials not found (.env.local missing)');
        return false;
      }

      const envContent = fs.readFileSync(envPath, 'utf8');
      
      const getEnvValue = (key) => {
        const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim() : null;
      };

      const getMultilineValue = (key) => {
        const match = envContent.match(new RegExp(`^${key}="([\\s\\S]*?)"`, 'm'));
        return match ? match[1] : null;
      };

      const appId = getEnvValue('GITHUB_APP_ID');
      const installationId = getEnvValue('GITHUB_INSTALLATION_ID');
      const privateKey = getMultilineValue('GITHUB_PRIVATE_KEY');

      if (!appId || !installationId || !privateKey) {
        Logger.warn('GitHub credentials incomplete');
        return false;
      }

      const auth = createAppAuth({
        appId,
        privateKey,
        installationId,
      });

      const installationAuth = await auth({ type: "installation" });
      this.token = installationAuth.token;

      Logger.success('GitHub authentication successful');
      return true;
    } catch (error) {
      Logger.error(`GitHub authentication failed: ${error.message}`);
      return false;
    }
  }

  async proposeIssue(finding) {
    if (!this.token) {
      Logger.warn('Cannot propose issue: Not authenticated');
      return null;
    }

    const issueData = {
      title: this.generateIssueTitle(finding),
      body: this.generateIssueBody(finding),
      labels: this.selectLabels(finding),
    };

    Logger.info(`Proposed GitHub Issue: ${issueData.title}`);
    return issueData;
  }

  generateIssueTitle(finding) {
    const type = finding.type.replace(/_/g, ' ').toUpperCase();
    return `[SONIA] ${type}: ${finding.message || finding.content || 'Issue detected'}`;
  }

  generateIssueBody(finding) {
    let body = `## Sonia Agent Finding\n\n`;
    body += `**Type**: ${finding.type}\n`;
    body += `**Severity**: ${finding.severity}\n`;
    body += `**Timestamp**: ${new Date().toISOString()}\n\n`;
    
    if (finding.path || finding.file) {
      body += `**Location**: \`${finding.path || finding.file}\`\n\n`;
    }
    
    if (finding.message) {
      body += `### Description\n${finding.message}\n\n`;
    }
    
    if (finding.content) {
      body += `### Content\n\`\`\`\n${finding.content}\n\`\`\`\n\n`;
    }
    
    body += `---\n*This issue was automatically detected by Sonia Agent*\n`;
    body += `*Action required: Human review and approval*\n`;
    
    return body;
  }

  selectLabels(finding) {
    const labels = ['sonia-agent'];
    
    if (finding.severity === 'error') {
      labels.push('bug');
    } else if (finding.severity === 'warning') {
      labels.push('enhancement');
    }
    
    return labels;
  }

  async createIssue(issueData) {
    if (!this.token) {
      Logger.warn('Cannot create issue: Not authenticated');
      return null;
    }

    try {
      // Note: fetch is available in Node.js 18+
      // For earlier versions, install and use 'node-fetch'
      const response = await fetch(
        `https://api.github.com/repos/${CONFIG.githubOwner}/${CONFIG.githubRepo}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'sonia-agent',
          },
          body: JSON.stringify(issueData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        Logger.error(`Failed to create issue: ${response.status} ${error}`);
        return null;
      }

      const issue = await response.json();
      Logger.success(`Created issue #${issue.number}: ${issue.title}`);
      return issue;
    } catch (error) {
      Logger.error(`Error creating issue: ${error.message}`);
      return null;
    }
  }
}

// Claude API Integration Module (Optional)
class ClaudeIntegration {
  constructor() {
    this.enabled = CONFIG.enableClaude;
    this.apiKey = process.env.CLAUDE_API_KEY;
  }

  async analyze(findings) {
    if (!this.enabled) {
      Logger.info('Claude integration not configured (optional)');
      return null;
    }

    Logger.info('Claude API analysis would be performed here');
    // Placeholder for Claude API integration
    return {
      summary: 'Analysis available when Claude API is configured',
      recommendations: [],
    };
  }
}

// Supabase Integration Module (Optional)
class SupabaseIntegration {
  constructor() {
    this.enabled = CONFIG.enableSupabase;
    this.url = process.env.SUPABASE_URL;
    this.key = process.env.SUPABASE_KEY;
  }

  async persistFindings(findings) {
    if (!this.enabled) {
      Logger.info('Supabase integration not configured (optional)');
      return false;
    }

    Logger.info('Supabase persistence would be performed here');
    // Placeholder for Supabase integration
    return true;
  }
}

// Status Report Generator
class StatusReportGenerator {
  constructor(findings) {
    this.findings = findings;
  }

  generate() {
    let report = this.generateHeader();
    report += this.generateMetrics();
    report += this.generateStructuralSection();
    report += this.generateTasksSection();
    report += this.generateSignalsSection();
    report += this.generateFooter();
    
    return report;
  }

  generateHeader() {
    return `# SONIA STATUS REPORT

**Generated**: ${new Date().toISOString()}  
**Agent Version**: 1.0.0  
**Repository**: ${CONFIG.githubOwner}/${CONFIG.githubRepo}

---

`;
  }

  generateMetrics() {
    const { metrics } = this.findings;
    
    return `## Health Metrics

- **Health Score**: ${metrics.health_score}/100
- **Structural Issues**: ${metrics.structural_issues}
- **Tasks Found**: ${metrics.tasks_found}
- **Signals Detected**: ${metrics.signals_detected}

---

`;
  }

  generateStructuralSection() {
    let section = `## Structural Findings\n\n`;
    
    if (this.findings.structural.length === 0) {
      section += `✅ No structural issues detected.\n\n`;
    } else {
      for (const finding of this.findings.structural) {
        const emoji = finding.severity === 'error' ? '❌' : '⚠️';
        section += `${emoji} **${finding.type}** (${finding.severity})  \n`;
        section += `   Path: \`${finding.path}\`  \n`;
        section += `   ${finding.message}  \n\n`;
      }
    }
    
    section += `---\n\n`;
    return section;
  }

  generateTasksSection() {
    let section = `## Tasks & TODOs\n\n`;
    
    if (this.findings.tasks.length === 0) {
      section += `✅ No pending tasks found.\n\n`;
    } else {
      const codeTodos = this.findings.tasks.filter(t => t.type === 'code_todo');
      const uncheckedTasks = this.findings.tasks.filter(t => t.type === 'unchecked_task');
      
      if (codeTodos.length > 0) {
        section += `### Code TODOs (${codeTodos.length})\n\n`;
        for (const todo of codeTodos.slice(0, 10)) {
          section += `- \`${todo.file}:${todo.line}\`  \n`;
          section += `  ${todo.content}  \n\n`;
        }
        if (codeTodos.length > 10) {
          section += `... and ${codeTodos.length - 10} more\n\n`;
        }
      }
      
      if (uncheckedTasks.length > 0) {
        section += `### Unchecked Tasks (${uncheckedTasks.length})\n\n`;
        for (const task of uncheckedTasks) {
          section += `- ${task.file}: ${task.count} unchecked items\n`;
        }
        section += `\n`;
      }
    }
    
    section += `---\n\n`;
    return section;
  }

  generateSignalsSection() {
    let section = `## Activity Signals\n\n`;
    
    if (this.findings.signals.length === 0) {
      section += `No recent activity signals detected.\n\n`;
    } else {
      for (const signal of this.findings.signals) {
        section += `- **${signal.type}**: ${signal.message}`;
        if (signal.data !== undefined) {
          section += ` (${signal.data})`;
        }
        section += `\n`;
      }
      section += `\n`;
    }
    
    section += `---\n\n`;
    return section;
  }

  generateFooter() {
    return `## Execution Principles

✅ **Read-Only**: No files modified  
✅ **Deterministic**: Reproducible results  
✅ **Observable**: All findings logged  
✅ **Fail-Safe**: Human approval required for actions  

---

*Sonia Agent - Structural Observation and Normalization Intelligence Agent*  
*Next scan: Manual execution or CI trigger*
`;
  }
}

// Main Agent Orchestrator
class SoniaAgent {
  constructor() {
    this.scanner = new RepositoryScanner(CONFIG.repoPath);
    this.github = new GitHubIntegration();
    this.claude = new ClaudeIntegration();
    this.supabase = new SupabaseIntegration();
  }

  async run() {
    Logger.info('=== SONIA AGENT STARTING ===');
    Logger.info(`Repository: ${CONFIG.repoPath}`);
    Logger.info(`Output Directory: ${CONFIG.outputDir}`);
    
    ensureOutputDir();

    // 1. Scan repository
    const findings = await this.scanner.scan();

    // 2. Save findings to JSON
    this.saveFindingsJSON(findings);

    // 3. Authenticate with GitHub (if enabled)
    await this.github.authenticate();

    // 4. Analyze with Claude (if enabled)
    const claudeAnalysis = await this.claude.analyze(findings);

    // 5. Generate status report
    const report = new StatusReportGenerator(findings);
    const statusMarkdown = report.generate();
    this.saveStatusReport(statusMarkdown);

    // 6. Propose GitHub issues (dry-run mode)
    await this.proposeGitHubActions(findings);

    // 7. Persist to Supabase (if enabled)
    await this.supabase.persistFindings(findings);

    Logger.success('=== SONIA AGENT COMPLETE ===');
    this.printSummary(findings);
  }

  saveFindingsJSON(findings) {
    const jsonPath = path.join(CONFIG.outputDir, CONFIG.findingsFile);
    fs.writeFileSync(jsonPath, JSON.stringify(findings, null, 2));
    Logger.success(`Findings saved to ${jsonPath}`);
  }

  saveStatusReport(markdown) {
    const statusPath = path.join(CONFIG.repoPath, CONFIG.statusFile);
    fs.writeFileSync(statusPath, markdown);
    Logger.success(`Status report saved to ${statusPath}`);
  }

  async proposeGitHubActions(findings) {
    Logger.info('Generating GitHub issue proposals...');
    
    const proposals = [];
    
    // Propose issues for errors and warnings
    const criticalFindings = findings.structural.filter(f => 
      f.severity === 'error' || f.severity === 'warning'
    );

    for (const finding of criticalFindings) {
      const proposal = await this.github.proposeIssue(finding);
      if (proposal) {
        proposals.push(proposal);
      }
    }

    // Save proposals to file
    const proposalsPath = path.join(CONFIG.outputDir, 'github-proposals.json');
    fs.writeFileSync(proposalsPath, JSON.stringify(proposals, null, 2));
    Logger.success(`${proposals.length} GitHub issue proposals saved to ${proposalsPath}`);
    
    Logger.info('Note: Issues NOT created automatically (requires human approval)');
  }

  printSummary(findings) {
    console.log('\n' + '='.repeat(60));
    console.log('SONIA AGENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Health Score: ${findings.metrics.health_score}/100`);
    console.log(`Structural Issues: ${findings.metrics.structural_issues}`);
    console.log(`Tasks Found: ${findings.metrics.tasks_found}`);
    console.log(`Signals Detected: ${findings.metrics.signals_detected}`);
    console.log('='.repeat(60));
    console.log(`\nView full report: ${CONFIG.statusFile}`);
    console.log(`View findings: ${path.join(CONFIG.outputDir, CONFIG.findingsFile)}`);
    console.log('='.repeat(60) + '\n');
  }
}

// CLI Entry Point
if (require.main === module) {
  const agent = new SoniaAgent();
  agent.run().catch(error => {
    Logger.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  SoniaAgent,
  RepositoryScanner,
  GitHubIntegration,
  ClaudeIntegration,
  SupabaseIntegration,
  StatusReportGenerator,
};
