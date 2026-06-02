import json
import urllib.request

TOKEN = "pk_112074279_SQZI5B4OLUS8UKTOPACFAGJGH6I9A5J3"
TEAM_ID = "90132645314"

def api_get(endpoint):
    url = f"https://api.clickup.com/api/v2/{endpoint}"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", TOKEN)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error calling {endpoint}: {e}")
        return None

# 1. List Spaces
spaces = api_get(f"team/{TEAM_ID}/space")
if spaces:
    for s in spaces["spaces"]:
        print(f"Space: {s['name']} (ID: {s['id']})")
        
        # 2. List Folders in each space
        folders = api_get(f"space/{s['id']}/folder")
        if folders:
            for f in folders["folders"]:
                print(f"  Folder: {f['name']} (ID: {f['id']})")
                
                # 3. List Lists in each folder
                lists = api_get(f"folder/{f['id']}/list")
                if lists:
                    for l in lists["lists"]:
                        print(f"    List: {l['name']} (ID: {l['id']})")
        
        # 4. List Folderless Lists in each space
        fl_lists = api_get(f"space/{s['id']}/list")
        if fl_lists:
            for l in fl_lists["lists"]:
                print(f"    Folderless List: {l['name']} (ID: {l['id']})")
