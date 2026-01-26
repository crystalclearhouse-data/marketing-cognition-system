#!/usr/bin/env node

/**
 * FRED AGENT - Execution Agent
 * 
 * Requirements:
 * - Node.js 18+
 * - Supabase connection (SUPABASE_URL, SUPABASE_KEY)
 * 
 * Purpose: Execution agent that:
 * - Reads normalized payloads from Canonical Record
 * - Makes deterministic execution decisions
 * - Executes SAFE actions
 * - Updates CR with results
 * 
 * Execution Rules:
 * - Never asks questions, only acts
 * - Owns timing and execution
 * - Updates last_actor on every CR mutation
 * - Fail closed: REVIEW if uncertain
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  pollInterval: parseInt(process.env.FRED_POLL_INTERVAL || '30000'), // 30 seconds default
  dryRun: process.env.FRED_DRY_RUN === 'true',
  repoPath: process.cwd(),
};

// Logger utility
const Logger = {
  info: (msg) => console.log(`[FRED INFO] ${msg}`),
  warn: (msg) => console.warn(`[FRED WARN] ${msg}`),
  error: (msg) => console.error(`[FRED ERROR] ${msg}`),
  success: (msg) => console.log(`[FRED ✓] ${msg}`),
};

// Supabase Client
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.baseUrl = `${url}/rest/v1`;
  }

  async query(table, filters = {}, select = '*') {
    const params = new URLSearchParams({ select });
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value.op) {
        params.append(key, `${value.op}.${value.value}`);
      } else {
        params.append(key, `eq.${value}`);
      }
    });

    const response = await fetch(`${this.baseUrl}/${table}?${params}`, {
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase query failed: ${response.status} ${await response.text()}`);
    }

    return await response.json();
  }

  async update(table, id, data) {
    const response = await fetch(`${this.baseUrl}/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Supabase update failed: ${response.status} ${await response.text()}`);
    }

    return await response.json();
  }
}

// Canonical Record Reader
class CanonicalRecordReader {
  constructor(client) {
    this.client = client;
  }

  async getPendingRecords() {
    // Fetch records where status=cleaned and last_actor=sonia
    return await this.client.query('canonical_records', {
      status: 'cleaned',
      last_actor: 'sonia',
    });
  }

  async updateRecord(id, updates) {
    // Enforce last_actor update
    if (!updates.last_actor) {
      throw new Error('Cannot update CR without setting last_actor');
    }

    // Always update timestamp
    updates.updated_at = new Date().toISOString();

    return await this.client.update('canonical_records', id, updates);
  }
}

// Decision Engine
class DecisionEngine {
  evaluate(normalizedPayload) {
    // Deterministic decision logic
    Logger.info('Evaluating normalized payload...');

    // Safety checks
    if (!normalizedPayload || typeof normalizedPayload !== 'object') {
      return {
        verdict: 'FAIL',
        reason: 'Invalid payload structure',
        next_action: null,
      };
    }

    // Check for actions array
    if (!Array.isArray(normalizedPayload.actions) || normalizedPayload.actions.length === 0) {
      return {
        verdict: 'REVIEW',
        reason: 'No actions specified in payload',
        next_action: 'Human review required: missing actions array',
      };
    }

    // Allowlist of safe action types
    const safeActions = [
      'create_github_issue',
      'update_status_report',
      'log_finding',
      'notify_webhook',
    ];

    // Evaluate each action
    const results = [];
    for (const action of normalizedPayload.actions) {
      const actionType = action.action_type;

      if (!actionType) {
        results.push({
          action,
          verdict: 'FAIL',
          reason: 'Missing action_type field',
        });
        continue;
      }

      if (!safeActions.includes(actionType)) {
        results.push({
          action,
          verdict: 'REVIEW',
          reason: `Action type '${actionType}' not in safe allowlist`,
        });
        continue;
      }

      // Additional safety checks per action type
      if (actionType === 'create_github_issue') {
        if (!action.title || !action.body) {
          results.push({
            action,
            verdict: 'FAIL',
            reason: 'GitHub issue missing required fields (title, body)',
          });
          continue;
        }
      }

      // Action passed all checks
      results.push({
        action,
        verdict: 'SAFE',
        reason: 'Passed all safety checks',
      });
    }

    // Overall verdict: FAIL if any FAIL, REVIEW if any REVIEW, else SAFE
    const hasFailure = results.some(r => r.verdict === 'FAIL');
    const hasReview = results.some(r => r.verdict === 'REVIEW');

    let overallVerdict = 'SAFE';
    let reason = 'All actions passed safety checks';
    let next_action = `Execute ${results.length} action(s)`;

    if (hasFailure) {
      overallVerdict = 'FAIL';
      const failedActions = results.filter(r => r.verdict === 'FAIL');
      reason = `${failedActions.length} action(s) failed validation`;
      next_action = null;
    } else if (hasReview) {
      overallVerdict = 'REVIEW';
      const reviewActions = results.filter(r => r.verdict === 'REVIEW');
      reason = `${reviewActions.length} action(s) require human review`;
      next_action = 'Human approval required for non-standard actions';
    }

    return {
      verdict: overallVerdict,
      reason,
      next_action,
      action_results: results, // Include individual action verdicts
    };
  }
}

// Executor
class Executor {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
  }

  async execute(normalizedPayload, decision) {
    if (decision.verdict !== 'SAFE') {
      Logger.warn('Skipping execution: verdict is not SAFE');
      return { success: false, message: 'Not SAFE to execute' };
    }

    if (!Array.isArray(normalizedPayload.actions)) {
      Logger.error('No actions array in normalized payload');
      return { success: false, message: 'Invalid payload: no actions array' };
    }

    Logger.info(`Executing ${normalizedPayload.actions.length} action(s)`);

    const executionResults = [];

    // Execute each SAFE action
    for (const actionResult of decision.action_results) {
      if (actionResult.verdict !== 'SAFE') {
        Logger.warn(`Skipping action ${actionResult.action.action_type}: ${actionResult.reason}`);
        executionResults.push({
          action: actionResult.action,
          success: false,
          skipped: true,
          reason: actionResult.reason,
        });
        continue;
      }

      const action = actionResult.action;
      const actionType = action.action_type;
      
      Logger.info(`Executing action: ${actionType}`);

      if (this.dryRun) {
        Logger.info(`[DRY RUN] Would execute ${actionType}`);
        executionResults.push({
          action,
          success: true,
          message: `[DRY RUN] Would execute ${actionType}`,
          dry_run: true,
        });
        continue;
      }

      try {
        let result;
        switch (actionType) {
          case 'create_github_issue':
            result = await this.createGitHubIssue(action);
            break;
          
          case 'update_status_report':
            result = await this.updateStatusReport(action);
            break;
          
          case 'log_finding':
            result = await this.logFinding(action);
            break;
          
          case 'notify_webhook':
            result = await this.notifyWebhook(action);
            break;
          
          default:
            throw new Error(`Unknown action type: ${actionType}`);
        }

        executionResults.push({
          action,
          ...result,
        });
      } catch (error) {
        Logger.error(`Action ${actionType} failed: ${error.message}`);
        executionResults.push({
          action,
          success: false,
          message: error.message,
          error: error.stack,
        });
      }
    }

    // Overall success if all executed actions succeeded
    const allSucceeded = executionResults.every(r => r.skipped || r.success);

    return {
      success: allSucceeded,
      message: `Executed ${executionResults.length} action(s)`,
      results: executionResults,
    };
  }

  async createGitHubIssue(action) {
    Logger.info(`[EXECUTOR] Creating GitHub issue: ${action.title}`);
    // Implementation would go here
    return { success: true, message: 'GitHub issue created (placeholder)' };
  }

  async updateStatusReport(action) {
    Logger.info('[EXECUTOR] Updating status report');
    // Implementation would go here
    return { success: true, message: 'Status report updated (placeholder)' };
  }

  async logFinding(action) {
    Logger.info('[EXECUTOR] Logging finding');
    const logDir = path.join(CONFIG.repoPath, '.sonia', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(action, null, 2));
    
    return { success: true, message: `Finding logged to ${logFile}` };
  }

  async notifyWebhook(action) {
    Logger.info(`[EXECUTOR] Notifying webhook: ${action.webhook_url}`);
    // Implementation would go here
    return { success: true, message: 'Webhook notified (placeholder)' };
  }
}

// Main Fred Agent
class FredAgent {
  constructor() {
    this.validateConfig();
    
    this.client = new SupabaseClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    this.crReader = new CanonicalRecordReader(this.client);
    this.decisionEngine = new DecisionEngine();
    this.executor = new Executor(CONFIG.dryRun);
    this.running = false;
  }

  validateConfig() {
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY must be set');
    }
  }

  async processRecord(record) {
    Logger.info(`Processing record ${record.id}`);

    try {
      // Step 1: Evaluate
      const decision = this.decisionEngine.evaluate(record.normalized_payload);
      Logger.info(`Decision: ${decision.verdict} - ${decision.reason}`);

      // Step 2: Execute if SAFE
      let executionResult = null;
      if (decision.verdict === 'SAFE') {
        executionResult = await this.executor.execute(record.normalized_payload, decision);
      }

      // Step 3: Update CR
      const updates = {
        verdict: decision.verdict,
        next_action: decision.next_action,
        last_actor: 'fred',
      };

      if (decision.verdict === 'SAFE' && executionResult) {
        updates.status = executionResult.success ? 'executed' : 'failed';
      } else if (decision.verdict === 'REVIEW') {
        updates.status = 'review';
      } else if (decision.verdict === 'FAIL') {
        updates.status = 'failed';
      }

      await this.crReader.updateRecord(record.id, updates);
      Logger.success(`Record ${record.id} updated: ${updates.status}`);

      return { success: true, verdict: decision.verdict, status: updates.status };
    } catch (error) {
      Logger.error(`Failed to process record ${record.id}: ${error.message}`);
      
      // Update CR to failed state
      try {
        await this.crReader.updateRecord(record.id, {
          status: 'failed',
          verdict: 'FAIL',
          next_action: `Error: ${error.message}`,
          last_actor: 'fred',
        });
      } catch (updateError) {
        Logger.error(`Failed to update record after error: ${updateError.message}`);
      }

      return { success: false, error: error.message };
    }
  }

  async poll() {
    Logger.info('Polling for pending records...');

    try {
      const pendingRecords = await this.crReader.getPendingRecords();
      Logger.info(`Found ${pendingRecords.length} pending records`);

      for (const record of pendingRecords) {
        await this.processRecord(record);
      }

      if (pendingRecords.length === 0) {
        Logger.info('No pending records. Waiting...');
      }
    } catch (error) {
      Logger.error(`Poll failed: ${error.message}`);
    }
  }

  async start() {
    Logger.info('=== FRED AGENT STARTING ===');
    Logger.info(`Supabase URL: ${CONFIG.supabaseUrl}`);
    Logger.info(`Poll Interval: ${CONFIG.pollInterval}ms`);
    Logger.info(`Dry Run: ${CONFIG.dryRun}`);

    this.running = true;

    // Initial poll
    await this.poll();

    // Set up polling interval
    this.pollTimer = setInterval(async () => {
      if (this.running) {
        await this.poll();
      }
    }, CONFIG.pollInterval);

    Logger.success('Fred agent running. Press Ctrl+C to stop.');
  }

  stop() {
    Logger.info('=== FRED AGENT STOPPING ===');
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
}

// CLI Entry Point
if (require.main === module) {
  const agent = new FredAgent();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    agent.stop();
    process.exit(0);
  });

  agent.start().catch(error => {
    Logger.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  FredAgent,
  DecisionEngine,
  Executor,
  CanonicalRecordReader,
  SupabaseClient,
};
