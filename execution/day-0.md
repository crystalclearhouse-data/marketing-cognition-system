# Day 0: Activation

**Goal**: System is live and capable of capturing signals.

## Checklist

### 1. Environment Setup
- [ ] Clone repository: `git clone ...`
- [ ] Install python dependencies: `pip install requests`
- [ ] Run setup script: `python tools/setup_system.py` (ensure env vars set).

### 2. Verify Connections
- [ ] Check Notion: "Marketing Cognition System" page exists.
- [ ] Check ClickUp: "Marketing Cognition" space exists.
- [ ] Check n8n: Import workflows from `workflows/` and activate.

### 3. First Beliefs
- [ ] Edit `beliefs/core-beliefs.md` with your initial hypothesis.
- [ ] Commit and Push: `git commit -am "chore: set initial beliefs" && git push`
- [ ] Verify: Check Notion to see if `Beliefs` page updated (via n8n sync).

### 4. Test Signal Intake
- [ ] Send a test POST to your n8n webhook URL.
- [ ] Verify GitHub Issue created.
- [ ] Verify ClickUp Task created.
- [ ] Verify Notion Entry created.
