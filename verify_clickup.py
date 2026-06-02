import json
import urllib.request

TOKEN = "pk_112074279_SQZI5B4OLUS8UKTOPACFAGJGH6I9A5J3"

def get_teams():
    url = "https://api.clickup.com/api/v2/team"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", TOKEN)
    req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Auth verification failed: {e}")
        return None

teams = get_teams()
print(json.dumps(teams, indent=2))
