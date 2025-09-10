import requests

url = "http://localhost:5000/api/hotel-recommend"
payload = {
    "place": "udaipur",
    "budget": 2500
}
resp = requests.post(url, json=payload)
print("Status:", resp.status_code)
print(resp.json())
