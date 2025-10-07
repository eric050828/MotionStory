"""
Workouts Router
運動記錄 CRUD、統計、匯出/匯入
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import List, Optional, Dict
import io

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import (
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutResponse,
    WorkoutStatsResponse,
    WorkoutBatchCreate,
)
from ..services import WorkoutService, AchievementService

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.post("", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout_data: WorkoutCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    建立運動記錄

    - 儲存運動記錄
    - 自動檢查成就觸發
    - 回傳運動記錄與觸發的成就
    """
    workout_service = WorkoutService(db)
    achievement_service = AchievementService(db)

    # 建立運動記錄
    workout = await workout_service.create_workout(current_user_id, workout_data)

    # 檢查成就
    achievements_triggered = await achievement_service.check_achievements(
        current_user_id, workout
    )

    return {
        "workout": WorkoutResponse(**workout.dict(by_alias=True)),
        "achievements_triggered": [a.dict() for a in achievements_triggered]
    }


@router.get("", response_model=Dict)
async def list_workouts(
    limit: int = 20,
    cursor: Optional[str] = None,
    workout_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    列出運動記錄 (cursor-based pagination)

    - limit: 每頁數量
    - cursor: 分頁游標
    - workout_type: 篩選運動類型
    - start_date: 開始日期篩選
    - end_date: 結束日期篩選
    """
    workout_service = WorkoutService(db)

    workouts, next_cursor = await workout_service.list_workouts(
        user_id=current_user_id,
        limit=limit,
        cursor=cursor,
        workout_type=workout_type,
        start_date=start_date,
        end_date=end_date
    )

    return {
        "workouts": [WorkoutResponse(**w.dict(by_alias=True)) for w in workouts],
        "next_cursor": next_cursor,
        "has_next": next_cursor is not None
    }


@router.get("/{workout_id}", response_model=WorkoutResponse)
async def get_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得單筆運動記錄
    """
    workout_service = WorkoutService(db)

    workout = await workout_service.get_workout(workout_id, current_user_id)

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    return WorkoutResponse(**workout.dict(by_alias=True))


@router.put("/{workout_id}", response_model=WorkoutResponse)
async def update_workout(
    workout_id: str,
    workout_data: WorkoutUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    更新運動記錄
    """
    workout_service = WorkoutService(db)

    workout = await workout_service.update_workout(
        workout_id, current_user_id, workout_data
    )

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    return WorkoutResponse(**workout.dict(by_alias=True))


@router.delete("/{workout_id}", status_code=status.HTTP_200_OK)
async def delete_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    軟刪除運動記錄

    - 標記 is_deleted=true
    - 30 天內可復原
    """
    workout_service = WorkoutService(db)

    success = await workout_service.soft_delete_workout(workout_id, current_user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    return {"message": "Workout deleted successfully", "days_until_permanent_deletion": 30}


@router.post("/{workout_id}/restore", response_model=WorkoutResponse)
async def restore_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    復原已刪除的運動記錄
    """
    workout_service = WorkoutService(db)

    workout = await workout_service.restore_workout(workout_id, current_user_id)

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workout not found or restoration period expired (30 days)"
        )

    return WorkoutResponse(**workout.dict(by_alias=True))


@router.get("/trash", response_model=List[Dict])
async def list_trash(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    列出垃圾桶中的運動記錄

    - 顯示剩餘天數
    - 只顯示 30 天內的記錄
    """
    workout_service = WorkoutService(db)

    trash_items = await workout_service.list_trash(current_user_id)

    return [
        {
            "workout": WorkoutResponse(**item["workout"].dict(by_alias=True)),
            "days_remaining": item["days_remaining"],
            "deleted_at": item["deleted_at"],
            "delete_after": item["delete_after"]
        }
        for item in trash_items
    ]


@router.post("/batch", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def batch_create_workouts(
    batch_data: WorkoutBatchCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    批次建立運動記錄

    - 部分失敗處理
    - 回傳成功與失敗列表
    """
    workout_service = WorkoutService(db)

    created_workouts, failed_workouts = await workout_service.batch_create_workouts(
        current_user_id, batch_data.workouts
    )

    return {
        "created_count": len(created_workouts),
        "failed_count": len(failed_workouts),
        "created_workouts": [
            WorkoutResponse(**w.dict(by_alias=True)) for w in created_workouts
        ],
        "failed_workouts": failed_workouts
    }


@router.get("/stats", response_model=WorkoutStatsResponse)
async def get_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得運動統計摘要

    - start_date: 開始日期
    - end_date: 結束日期
    """
    workout_service = WorkoutService(db)

    stats = await workout_service.get_stats(
        user_id=current_user_id,
        start_date=start_date,
        end_date=end_date
    )

    return stats


@router.get("/export", response_class=StreamingResponse)
async def export_workouts(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    匯出運動記錄為 CSV

    - Content-Type: text/csv
    - 包含所有運動記錄
    """
    workout_service = WorkoutService(db)

    csv_content = await workout_service.export_to_csv(current_user_id)

    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=workouts_export.csv"
        }
    )


@router.post("/import", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def import_workouts(
    csv_file: str,  # TODO: 改為 UploadFile
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    從 CSV 匯入運動記錄

    - 格式驗證
    - 部分失敗處理
    """
    # TODO: 實作 CSV 解析與匯入邏輯
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="CSV import not yet implemented"
    )
