"""
Test ActivityResponse serialization to understand why image_url is missing
"""
import json
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.models.activity import ActivityResponse

# Create an ActivityResponse with image_url
response_with_image = ActivityResponse(
    activity_id="test123",
    user_id="user123",
    user_name="Test User",
    user_avatar=None,
    activity_type="workout",
    reference_id="ref123",
    content={"test": "data"},
    image_url="https://images.pexels.com/photos/123/test.jpeg",
    caption="Test caption",
    likes_count=5,
    comments_count=2,
    is_liked_by_me=True,
    created_at=datetime.now()
)

# Create an ActivityResponse without image_url
response_without_image = ActivityResponse(
    activity_id="test456",
    user_id="user456",
    user_name="Test User 2",
    user_avatar=None,
    activity_type="workout",
    reference_id="ref456",
    content={"test": "data"},
    image_url=None,
    caption=None,
    likes_count=3,
    comments_count=1,
    is_liked_by_me=False,
    created_at=datetime.now()
)

print("=== Response WITH image_url ===")
print("model_dump():")
dump = response_with_image.model_dump()
print(f"  Keys: {list(dump.keys())}")
print(f"  image_url: {dump.get('image_url')}")
print(f"  caption: {dump.get('caption')}")

print("\nmodel_dump(mode='json'):")
dump_json = response_with_image.model_dump(mode='json')
print(f"  Keys: {list(dump_json.keys())}")
print(f"  image_url: {dump_json.get('image_url')}")

print("\nJSON string via model_dump_json():")
json_str = response_with_image.model_dump_json()
parsed = json.loads(json_str)
print(f"  Keys: {list(parsed.keys())}")
print(f"  image_url: {parsed.get('image_url')}")

print("\n=== Response WITHOUT image_url (None) ===")
print("model_dump():")
dump_none = response_without_image.model_dump()
print(f"  Keys: {list(dump_none.keys())}")
print(f"  image_url present: {'image_url' in dump_none}")
print(f"  image_url value: {dump_none.get('image_url')}")

print("\nmodel_dump(mode='json'):")
dump_none_json = response_without_image.model_dump(mode='json')
print(f"  Keys: {list(dump_none_json.keys())}")
print(f"  image_url present: {'image_url' in dump_none_json}")

print("\nJSON string via model_dump_json():")
json_str_none = response_without_image.model_dump_json()
parsed_none = json.loads(json_str_none)
print(f"  Keys: {list(parsed_none.keys())}")
print(f"  image_url present: {'image_url' in parsed_none}")
print(f"  image_url value: {parsed_none.get('image_url', 'NOT_FOUND')}")
