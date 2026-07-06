import requests

url = "https://youssef-d1aa-soil-health.hf.space/api/soil-health/"
payload = {"lat": 30.0, "lon": 31.0}

try:
    response = requests.post(url, json=payload, timeout=10)
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.json())
except Exception as e:
    print("ERROR:", e)
