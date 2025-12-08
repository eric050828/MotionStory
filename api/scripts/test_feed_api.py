"""Test feed API to verify image_url is present"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Login
login_resp = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "demo@example.com", "password": "Demo1234"}
)

if login_resp.status_code != 200:
    print(f"Login failed: {login_resp.text}")
    exit(1)

token = login_resp.json().get("access_token")
print(f"Token: {token[:30]}...")

# Fetch feed
headers = {"Authorization": f"Bearer {token}"}
feed_resp = requests.get(f"{BASE_URL}/social/feed?limit=3", headers=headers)

if feed_resp.status_code != 200:
    print(f"Feed failed: {feed_resp.text}")
    exit(1)

data = feed_resp.json()
print(f"\nTotal activities: {len(data.get('activities', []))}")
print(f"has_more: {data.get('has_more')}")
print(f"next_cursor: {data.get('next_cursor')}")

if data.get("activities"):
    print("\n=== First Activity ===")
    first = data["activities"][0]
    print(f"Keys: {list(first.keys())}")
    print(f"image_url present: {'image_url' in first}")
    print(f"image_url value: {first.get('image_url', 'NOT_FOUND')}")
    print(f"caption: {first.get('caption', 'NOT_FOUND')}")
    print(f"user_name: {first.get('user_name')}")
    print(f"activity_type: {first.get('activity_type')}")
