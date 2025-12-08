"""Test API serialization of dashboard"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings
from src.models import DashboardInDB, DashboardResponse

async def test():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    dashboard = await db.dashboards.find_one({'_id': ObjectId('692bf54646c28714ec4ef6c4')})

    print('=== Raw MongoDB document (widgets[0]) ===')
    print(json.dumps(dashboard['widgets'][0], default=str, indent=2))

    print('\n=== Pydantic DashboardInDB ===')
    db_model = DashboardInDB(**dashboard)
    print(f'widgets[0].visible = {db_model.widgets[0].visible}')
    print(f'type(widgets[0].visible) = {type(db_model.widgets[0].visible)}')

    print('\n=== DashboardInDB.model_dump() ===')
    dumped = db_model.model_dump()
    print(json.dumps(dumped['widgets'][0], default=str, indent=2))

    print('\n=== DashboardResponse (as returned by API) ===')
    response = DashboardResponse(
        id=str(db_model.id),
        user_id=str(db_model.user_id),
        name=db_model.name,
        widgets=db_model.widgets,
        is_default=db_model.is_default,
        created_at=db_model.created_at,
        updated_at=db_model.updated_at,
        last_accessed_at=db_model.last_accessed_at
    )
    response_dump = response.model_dump()
    print(json.dumps(response_dump['widgets'][0], default=str, indent=2))

    print('\n=== model_dump_json() (actual JSON output) ===')
    json_output = response.model_dump_json()
    parsed = json.loads(json_output)
    print(json.dumps(parsed['widgets'][0], indent=2))

    client.close()

if __name__ == "__main__":
    asyncio.run(test())
