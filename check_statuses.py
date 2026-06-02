import json
import urllib.request

TOKEN = "pk_112074279_SQZI5B4OLUS8UKTOPACFAGJGH6I9A5J3"
LIST_ID = "901325044221"

def api_get(endpoint):
    url = f"https://api.clickup.com/api/v2/{endpoint}"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", TOKEN)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error: {e}")
        return None

# Get List details (includes statuses)
list_details = api_get(f"list/{LIST_ID}")
if list_details:
    print(json.dumps(list_details["statuses"], indent=2))
