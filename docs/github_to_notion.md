# GitHub → Notion Workflow

## Purpose
Convert GitHub issues into durable cognition by storing them in Notion.

## Trigger
- GitHub Issue opened or edited

## Input (Required)
- issue.title
- issue.body
- issue.url
- issue.author
- repository.name

## Output
- One Notion page per GitHub issue
- Linked back to the original issue

## Success Criteria
- Issue appears in Notion within 60 seconds
- Title and body match GitHub
- URL backlink present

## Failure Handling
- If Notion API fails, log error and do NOT silently drop the issue
- Workflow must fail closed (no partial writes)
