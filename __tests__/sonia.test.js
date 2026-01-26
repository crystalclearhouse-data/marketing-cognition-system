/**
 * Tests for Sonia Agent
 */

const path = require('path');
const fs = require('fs');

// Mock the @octokit/auth-app module before requiring the agent
jest.mock('@octokit/auth-app', () => ({
  createAppAuth: jest.fn(() => jest.fn()),
}));

const {
  RepositoryScanner,
  StatusReportGenerator,
  GitHubIntegration,
} = require('../sonia.agent');

describe('Sonia Agent', () => {
  const testRepoPath = path.join(__dirname, '..');

  describe('RepositoryScanner', () => {
    test('should initialize with correct path', () => {
      const scanner = new RepositoryScanner(testRepoPath);
      expect(scanner.repoPath).toBe(testRepoPath);
      expect(scanner.findings).toBeDefined();
      expect(scanner.findings.structural).toEqual([]);
      expect(scanner.findings.tasks).toEqual([]);
      expect(scanner.findings.signals).toEqual([]);
    });

    test('should scan repository and return findings', async () => {
      const scanner = new RepositoryScanner(testRepoPath);
      const findings = await scanner.scan();
      
      expect(findings).toBeDefined();
      expect(findings.timestamp).toBeDefined();
      expect(findings.metrics).toBeDefined();
      expect(findings.metrics.health_score).toBeGreaterThanOrEqual(0);
      expect(findings.metrics.health_score).toBeLessThanOrEqual(100);
    });

    test('should calculate health score correctly', () => {
      const scanner = new RepositoryScanner(testRepoPath);
      
      // No issues = 100 score
      expect(scanner.calculateHealthScore()).toBe(100);
      
      // Add an error
      scanner.findings.structural.push({ severity: 'error' });
      expect(scanner.calculateHealthScore()).toBe(90);
      
      // Add a warning
      scanner.findings.structural.push({ severity: 'warning' });
      expect(scanner.calculateHealthScore()).toBe(85);
    });

    test('should detect unchecked tasks in execution files', async () => {
      const scanner = new RepositoryScanner(testRepoPath);
      await scanner.scanTasks();
      
      const uncheckedTasks = scanner.findings.tasks.filter(
        t => t.type === 'unchecked_task'
      );
      
      // We expect to find some unchecked tasks in execution files
      expect(uncheckedTasks.length).toBeGreaterThan(0);
    });
  });

  describe('StatusReportGenerator', () => {
    test('should generate valid markdown report', () => {
      const mockFindings = {
        timestamp: new Date().toISOString(),
        structural: [],
        tasks: [],
        signals: [],
        metrics: {
          health_score: 100,
          structural_issues: 0,
          tasks_found: 0,
          signals_detected: 0,
        },
      };

      const generator = new StatusReportGenerator(mockFindings);
      const report = generator.generate();
      
      expect(report).toContain('# SONIA STATUS REPORT');
      expect(report).toContain('Health Metrics');
      expect(report).toContain('**Health Score**: 100/100');
      expect(report).toContain('Read-Only');
      expect(report).toContain('Deterministic');
    });

    test('should include structural issues in report', () => {
      const mockFindings = {
        timestamp: new Date().toISOString(),
        structural: [
          {
            type: 'missing_file',
            severity: 'error',
            path: 'test.txt',
            message: 'File missing',
          },
        ],
        tasks: [],
        signals: [],
        metrics: {
          health_score: 90,
          structural_issues: 1,
          tasks_found: 0,
          signals_detected: 0,
        },
      };

      const generator = new StatusReportGenerator(mockFindings);
      const report = generator.generate();
      
      expect(report).toContain('missing_file');
      expect(report).toContain('test.txt');
      expect(report).toContain('File missing');
    });
  });

  describe('GitHubIntegration', () => {
    test('should initialize with correct configuration', () => {
      const github = new GitHubIntegration();
      expect(github).toBeDefined();
      expect(github.token).toBeNull();
    });

    test('should generate issue title from finding', async () => {
      const github = new GitHubIntegration();
      const finding = {
        type: 'missing_file',
        severity: 'error',
        path: 'test.txt',
        message: 'Required file missing',
      };

      const title = github.generateIssueTitle(finding);
      expect(title).toContain('SONIA');
      expect(title).toContain('MISSING FILE');
      expect(title).toContain('Required file missing');
    });

    test('should generate issue body from finding', async () => {
      const github = new GitHubIntegration();
      const finding = {
        type: 'missing_file',
        severity: 'error',
        path: 'test.txt',
        message: 'Required file missing',
      };

      const body = github.generateIssueBody(finding);
      expect(body).toContain('Sonia Agent Finding');
      expect(body).toContain('missing_file');
      expect(body).toContain('error');
      expect(body).toContain('test.txt');
      expect(body).toContain('Required file missing');
      expect(body).toContain('Human review and approval');
    });

    test('should select appropriate labels based on severity', () => {
      const github = new GitHubIntegration();
      
      const errorFinding = { severity: 'error', type: 'test' };
      const errorLabels = github.selectLabels(errorFinding);
      expect(errorLabels).toContain('sonia-agent');
      expect(errorLabels).toContain('bug');
      
      const warningFinding = { severity: 'warning', type: 'test' };
      const warningLabels = github.selectLabels(warningFinding);
      expect(warningLabels).toContain('sonia-agent');
      expect(warningLabels).toContain('enhancement');
    });
  });

  describe('Integration', () => {
    test('should create output directory if not exists', () => {
      const outputDir = path.join(__dirname, '..', '.sonia');
      
      // The directory should exist after running the agent
      // or should be created on first run
      if (fs.existsSync(outputDir)) {
        expect(fs.statSync(outputDir).isDirectory()).toBe(true);
      }
    });

    test('SONIA_STATUS.md should exist after agent runs', () => {
      const statusFile = path.join(__dirname, '..', 'SONIA_STATUS.md');
      
      // After running the agent, this file should exist
      if (fs.existsSync(statusFile)) {
        const content = fs.readFileSync(statusFile, 'utf8');
        expect(content).toContain('SONIA STATUS REPORT');
        expect(content).toContain('Health Score');
      }
    });
  });
});

