"""
Timeline Router
時間軸、里程碑、年度回顧
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import List, Optional
import io

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import (
    MilestoneResponse,
    AnnualReviewResponse,
    AnnualReviewExportRequest,
    AnnualReviewExportResponse,
)
from ..services import TimelineService

router = APIRouter(prefix="/timeline", tags=["Timeline"])


@router.get("", response_model=List[MilestoneResponse])
async def list_timeline(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    highlighted_only: bool = False,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    列出時間軸里程碑

    - start_date: 開始日期
    - end_date: 結束日期
    - highlighted_only: 只顯示高亮項目
    """
    timeline_service = TimelineService(db)

    milestones = await timeline_service.list_milestones(
        user_id=current_user_id,
        start_date=start_date,
        end_date=end_date,
        highlighted_only=highlighted_only
    )

    return milestones


@router.get("/milestones", response_model=List[MilestoneResponse])
async def list_milestones(
    highlighted_only: bool = True,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    列出重要里程碑 (預設只顯示高亮項目)
    """
    timeline_service = TimelineService(db)

    milestones = await timeline_service.list_milestones(
        user_id=current_user_id,
        highlighted_only=highlighted_only
    )

    return milestones


@router.post("/annual-review", response_model=AnnualReviewResponse, status_code=status.HTTP_201_CREATED)
async def generate_annual_review(
    year: int,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    生成年度回顧

    - year: 年份 (例: 2024)
    - 效能目標: < 3 秒完成 (FR-035)
    - 快取 7 天
    """
    if year < 2020 or year > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year"
        )

    timeline_service = TimelineService(db)

    annual_review = await timeline_service.generate_annual_review(
        user_id=current_user_id,
        year=year
    )

    return annual_review


@router.get("/annual-review/{year}", response_model=AnnualReviewResponse)
async def get_annual_review(
    year: int,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得年度回顧 (從快取)

    - 如果快取不存在，會自動生成
    """
    if year < 2020 or year > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year"
        )

    timeline_service = TimelineService(db)

    annual_review = await timeline_service.generate_annual_review(
        user_id=current_user_id,
        year=year
    )

    return annual_review


@router.get("/annual-review/{year}/export", response_model=AnnualReviewExportResponse)
async def export_annual_review(
    year: int,
    request: AnnualReviewExportRequest = AnnualReviewExportRequest(),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    匯出年度回顧為圖片

    - 生成視覺化圖片
    - 上傳至 Cloudflare R2
    - 效能目標: < 5 秒完成 (FR-019)
    """
    from datetime import timedelta, timezone
    from bson import ObjectId

    # 取得年度回顧
    timeline_service = TimelineService(db)
    annual_review = await timeline_service.generate_annual_review(
        user_id=current_user_id,
        year=year
    )

    # TODO: 實際生成圖片並上傳至 R2
    export_url = f"https://r2.motionstory.app/annual-reviews/{current_user_id}/{year}.png"

    # 更新年度回顧的匯出 URL
    await db.annual_reviews.update_one(
        {"_id": ObjectId(annual_review.id)},
        {
            "$set": {
                "export_image_url": export_url,
                "export_generated_at": datetime.now(timezone.utc)
            }
        }
    )

    return AnnualReviewExportResponse(
        export_url=export_url,
        generated_at=datetime.now(timezone.utc),
        expires_in_seconds=604800  # 7 天
    )
