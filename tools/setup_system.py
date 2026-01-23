import os
import requests
import sys

# Requirements: pip install requests

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
CLICKUP_API_KEY = os.getenv("CLICKUP_API_KEY")
CLICKUP_TEAM_ID = os.getenv("CLICKUP_TEAM_ID")  # Optional, will fetch if missing

# Configuration
NOTION_ROOT_PAGE_ID = os.getenv("NOTION_ROOT_PAGE_ID")  # Optional, script can create new root if API allows, but usually needs a parent
CLICKUP_SPACE_NAME = "Marketing Cognition"

def log(msg):
    print(f"[SETUP] {msg}")

def check_creds():
    if not NOTION_API_KEY and not CLICKUP_API_KEY:
        log("Error: Missing API keys. Set NOTION_API_KEY and CLICKUP_API_KEY.")
        return False
    return True

# --- Notion ---
def create_notion_page(title, parent_id, children=None):
    url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }
    
    payload = {
        "parent": {"page_id": parent_id} if parent_id else {"type": "page_id", "page_id": "TODO"}, # Root creation is tricky without parent
        "properties": {
            "title": [
                {
                    "text": {
                        "content": title
                    }
                }
            ]
        }
    }
    if children:
        payload["children"] = children

    # Simple implementation: assumes valid parent_id
    if not parent_id:
        log("Skipping Notion creation: No NOTION_ROOT_PAGE_ID provided.")
        return None

    try:
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        page = resp.json()
        log(f"Created Notion page: {title} ({page['id']})")
        return page['id']
    except Exception as e:
        log(f"Failed to create Notion page {title}: {e}")
        return None

def setup_notion():
    if not NOTION_API_KEY:
        log("Skipping Notion setup (No API Key)")
        return
    
    if not NOTION_ROOT_PAGE_ID:
        log("Skipping Notion setup (No NOTION_ROOT_PAGE_ID)")
        return

    # Root: Marketing Cognition System
    # Note: If NOTION_ROOT_PAGE_ID points to the page itself, we create subpages. 
    # If it points to a parent, we create the root.
    # We will assume NOTION_ROOT_PAGE_ID is the PARENT where we should create "Marketing Cognition System"
    # OR the user might want us to populate an existing page.
    # Let's assume we create a new page "Marketing Cognition System" inside the parent.
    
    root_id = create_notion_page("Marketing Cognition System", NOTION_ROOT_PAGE_ID)
    if not root_id:
        return

    # Subpages
    structure = [
        "Beliefs",
        "Cognition Rules",
        "Content Library",
        "Signals Inbox",
        "Memory Vault",
        "Execution Cadence"
    ]
    
    pages = {}
    for name in structure:
        pid = create_notion_page(name, root_id)
        pages[name] = pid

    # Campaigns structure
    camp_id = create_notion_page("Campaigns", root_id)
    if camp_id:
        y2026 = create_notion_page("2026", camp_id)
        if y2026:
            for q in ["Q1 Awareness", "Q2 Proof", "Q3 Conversion", "Q4 Retention"]:
                create_notion_page(q, y2026)

# --- ClickUp ---
def get_clickup_team():
    url = "https://api.clickup.com/api/v2/team"
    headers = {"Authorization": CLICKUP_API_KEY}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    teams = resp.json().get("teams", [])
    if not teams:
        raise Exception("No teams found for this user.")
    return teams[0]["id"]

def setup_clickup():
    if not CLICKUP_API_KEY:
        log("Skipping ClickUp setup (No API Key)")
        return

    try:
        team_id = CLICKUP_TEAM_ID
        if not team_id:
            team_id = get_clickup_team()
            log(f"Using ClickUp Team: {team_id}")

        # Check/Create Space
        spaces_url = f"https://api.clickup.com/api/v2/team/{team_id}/space"
        headers = {"Authorization": CLICKUP_API_KEY}
        
        # Check existing
        existing_spaces = requests.get(spaces_url, headers=headers).json().get("spaces", [])
        space_id = next((s['id'] for s in existing_spaces if s['name'] == CLICKUP_SPACE_NAME), None)

        if not space_id:
            # Create Space
            payload = {"name": CLICKUP_SPACE_NAME, "multiple_assignees": True, "features": {"due_dates": {"enabled": True}}}
            resp = requests.post(spaces_url, json=payload, headers=headers)
            resp.raise_for_status()
            space_id = resp.json()["id"]
            log(f"Created ClickUp Space: {CLICKUP_SPACE_NAME}")
        else:
            log(f"Using Existing ClickUp Space: {CLICKUP_SPACE_NAME}")

        # Create Lists (Folderless)
        lists = [
            "Daily Ops",
            "Weekly Ops",
            "Campaigns",
            "Content Production",
            "Signals Triage",
            "Experiments"
        ]
        
        folderless_list_url = f"https://api.clickup.com/api/v2/space/{space_id}/list"
        
        # Get existing lists to avoid dupes
        # Note: ClickUp lists in space
        existing_lists_resp = requests.get(folderless_list_url, headers=headers) # Usually /folder/{folder_id}/list or /space/{space_id}/list
        # API behavior: get lists in space
        
        for lname in lists:
            # Simple create (ClickUp allows duplicates, but we try to be nice? No, minimal logic)
            payload = {"name": lname}
            requests.post(folderless_list_url, json=payload, headers=headers)
            log(f"Created List: {lname}")

    except Exception as e:
        log(f"ClickUp Setup Error: {e}")

if __name__ == "__main__":
    if check_creds():
        setup_notion()
        setup_clickup()
