"""
Dashboards Router
儀表板 CRUD、Widget 配置
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import (
    DashboardCreate,
    DashboardUpdate,
    DashboardResponse,
)
from ..services import DashboardService

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


def to_dashboard_response(dashboard) -> DashboardResponse:
    """Convert DashboardInDB to DashboardResponse"""
    return DashboardResponse(
        id=str(dashboard.id),
        user_id=str(dashboard.user_id),
        name=dashboard.name,
        widgets=dashboard.widgets,
        is_default=dashboard.is_default,
        created_at=dashboard.created_at,
        updated_at=dashboard.updated_at,
        last_accessed_at=dashboard.last_accessed_at
    )


@router.get("", response_model=List[DashboardResponse])
async def list_dashboards(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    列出使用者的所有儀表板

    - 預設儀表板會標記 is_default=true
    """
    dashboard_service = DashboardService(db)

    dashboards = await dashboard_service.list_dashboards(current_user_id)

    return [to_dashboard_response(d) for d in dashboards]


@router.get("/default", response_model=DashboardResponse)
async def get_default_dashboard(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得預設儀表板
    """
    dashboard_service = DashboardService(db)

    dashboard = await dashboard_service.get_default_dashboard(current_user_id)

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Default dashboard not found"
        )

    return to_dashboard_response(dashboard)


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得單一儀表板
    """
    dashboard_service = DashboardService(db)

    dashboard = await dashboard_service.get_dashboard(dashboard_id, current_user_id)

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    return to_dashboard_response(dashboard)


@router.post("", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    dashboard_data: DashboardCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    建立儀表板

    - 最多 20 個 widgets
    - 驗證 Widget 配置
    """
    dashboard_service = DashboardService(db)

    try:
        dashboard = await dashboard_service.create_dashboard(
            current_user_id, dashboard_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return to_dashboard_response(dashboard)


@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: str,
    dashboard_data: DashboardUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    更新儀表板

    - 即時儲存 Widget 配置
    - 驗證 Widget 數量限制
    """
    dashboard_service = DashboardService(db)

    try:
        dashboard = await dashboard_service.update_dashboard(
            dashboard_id, current_user_id, dashboard_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    return to_dashboard_response(dashboard)


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    dashboard_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    刪除儀表板

    - 預設儀表板不可刪除
    """
    dashboard_service = DashboardService(db)

    try:
        success = await dashboard_service.delete_dashboard(dashboard_id, current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    return None


@router.post("/{dashboard_id}/set-default", response_model=DashboardResponse)
async def set_default_dashboard(
    dashboard_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    設定為預設儀表板
    """
    dashboard_service = DashboardService(db)

    dashboard = await dashboard_service.set_default_dashboard(
        dashboard_id, current_user_id
    )

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    return to_dashboard_response(dashboard)
