"""
Challenge Service (T242-T244)
挑戰賽服務：創建管理、參與者管理、排名計算
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..models import (
    ChallengeCreate,
    ChallengeInDB,
    ChallengeResponse,
    ChallengeListItem,
    ChallengeDetail,
    ParticipantCreate,
    ParticipantInDB,
    ParticipantResponse,
    LeaderboardEntry,
)


class ChallengeService:
    """挑戰賽服務"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.challenges = db.challenges
        self.participants = db.participants
        self.users = db.users
        self.workouts = db.workouts
        self.friendships = db.friendships

    async def create_challenge(
        self,
        user_id: str,
        challenge_data: ChallengeCreate
    ) -> ChallengeResponse:
        """
        T242: 創建與管理挑戰賽

        創建新的運動挑戰賽
        - 挑戰類型: 總距離、總時長、連續天數、特定運動類型
        - 時間限制: 最短 3 天、最長 90 天
        - 參與人數: 最多 20 人

        Args:
            user_id: 創建者 ID
            challenge_data: 挑戰賽資料

        Returns:
            ChallengeResponse: 挑戰賽回應
        """
        # 檢查創建頻率限制 (1 小時最多 5 個)
        one_hour_ago = datetime.now(timezone.utc).timestamp() - 3600
        recent_challenges = await self.challenges.count_documents({
            "creator_id": ObjectId(user_id),
            "created_at": {"$gte": datetime.fromtimestamp(one_hour_ago, tz=timezone.utc)}
        })

        if recent_challenges >= 5:
            raise ValueError("Challenge creation rate limit exceeded (max 5 per hour)")

        # 判斷挑戰狀態
        now = datetime.now(timezone.utc)
        if challenge_data.start_date > now:
            status = "upcoming"
        elif challenge_data.start_date <= now < challenge_data.end_date:
            status = "active"
        else:
            status = "completed"

        # 建立挑戰賽
        challenge = ChallengeInDB(
            creator_id=ObjectId(user_id),
            challenge_type=challenge_data.challenge_type,
            target_value=challenge_data.target_value,
            start_date=challenge_data.start_date,
            end_date=challenge_data.end_date,
            workout_type=challenge_data.workout_type,
            privacy=challenge_data.privacy,
            status=status,
            participant_count=1,  # 創建者自動參與
            created_at=now
        )

        result = await self.challenges.insert_one(challenge.dict(by_alias=True, exclude={"id"}))
        challenge_id = str(result.inserted_id)

        # 創建者自動成為參與者
        await self._add_participant(challenge_id, user_id)

        # 如果有邀請使用者，發送邀請 (這裡簡化處理，實際應該透過通知系統)
        # for invited_user_id in challenge_data.invited_users:
        #     await notification_service.send_challenge_invite(user_id, invited_user_id, challenge_id)

        return ChallengeResponse(
            challenge_id=challenge_id,
            creator_id=user_id,
            challenge_type=challenge_data.challenge_type,
            target_value=challenge_data.target_value,
            start_date=challenge_data.start_date,
            end_date=challenge_data.end_date,
            workout_type=challenge_data.workout_type,
            privacy=challenge_data.privacy,
            status=status,
            participant_count=1,
            created_at=now
        )

    async def get_challenges(
        self,
        user_id: str,
        status: str = "active",
        role: str = "all",
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[ChallengeListItem], int]:
        """
        取得挑戰賽清單

        Args:
            user_id: 使用者 ID
            status: 挑戰狀態篩選 (active, completed, upcoming)
            role: 角色篩選 (creator, participant, all)
            limit: 每頁數量
            offset: 偏移量

        Returns:
            tuple: (挑戰列表, 總數)
        """
        # 構建查詢條件
        query = {"status": status}

        if role == "creator":
            query["creator_id"] = ObjectId(user_id)
        elif role == "participant":
            # 查詢參與的挑戰
            participant_challenges = await self.participants.find({
                "user_id": ObjectId(user_id)
            }).to_list(length=1000)

            challenge_ids = [p["challenge_id"] for p in participant_challenges]
            query["_id"] = {"$in": challenge_ids}

        # 計算總數
        total_count = await self.challenges.count_documents(query)

        # 查詢挑戰
        challenges_cursor = self.challenges.find(query).sort("start_date", -1).skip(offset).limit(limit)
        challenges = await challenges_cursor.to_list(length=limit)

        # 組裝回應
        challenge_items = []
        for challenge in challenges:
            # 查詢使用者的參與資料
            participant = await self.participants.find_one({
                "challenge_id": challenge["_id"],
                "user_id": ObjectId(user_id)
            })

            my_progress = 0
            my_rank = None

            if participant:
                my_progress = participant.get("completion_percentage", 0)
                my_rank = participant.get("rank")

            challenge_items.append(ChallengeListItem(
                challenge_id=str(challenge["_id"]),
                challenge_type=challenge["challenge_type"],
                target_value=challenge["target_value"],
                start_date=challenge["start_date"],
                end_date=challenge["end_date"],
                status=challenge["status"],
                participant_count=challenge["participant_count"],
                my_progress=my_progress,
                my_rank=my_rank
            ))

        return challenge_items, total_count

    async def get_challenge_detail(
        self,
        challenge_id: str,
        user_id: str
    ) -> ChallengeDetail:
        """
        取得挑戰賽詳情

        Args:
            challenge_id: 挑戰 ID
            user_id: 使用者 ID

        Returns:
            ChallengeDetail: 挑戰詳情
        """
        # 查詢挑戰
        challenge = await self.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise ValueError("Challenge not found")

        # 查詢創建者資料
        creator = await self.users.find_one({"_id": challenge["creator_id"]})

        # 查詢參與者資料
        participants_cursor = self.participants.find({"challenge_id": ObjectId(challenge_id)})
        participants = await participants_cursor.to_list(length=100)

        participant_list = []
        for p in participants:
            user = await self.users.find_one({"_id": p["user_id"]})
            if user:
                participant_list.append({
                    "user_id": str(p["user_id"]),
                    "display_name": user.get("display_name", ""),
                    "avatar_url": user.get("avatar_url"),
                    "joined_at": p["joined_at"],
                    "current_progress": p["current_progress"],
                    "completion_percentage": p["completion_percentage"],
                    "rank": p.get("rank"),
                    "status": p["status"]
                })

        return ChallengeDetail(
            challenge_id=str(challenge["_id"]),
            creator_id=str(challenge["creator_id"]),
            challenge_type=challenge["challenge_type"],
            target_value=challenge["target_value"],
            start_date=challenge["start_date"],
            end_date=challenge["end_date"],
            workout_type=challenge.get("workout_type"),
            privacy=challenge["privacy"],
            status=challenge["status"],
            participant_count=challenge["participant_count"],
            created_at=challenge["created_at"],
            description=challenge.get("description"),
            creator={
                "user_id": str(creator["_id"]),
                "display_name": creator.get("display_name", ""),
                "avatar_url": creator.get("avatar_url")
            } if creator else None,
            participants=participant_list
        )

    async def join_challenge(
        self,
        user_id: str,
        challenge_id: str
    ) -> ParticipantResponse:
        """
        T243: 參與者管理

        加入指定挑戰賽
        - 僅公開挑戰或被邀請的使用者可加入
        - 挑戰開始後無法加入
        - 參與人數上限 20 人

        Args:
            user_id: 使用者 ID
            challenge_id: 挑戰 ID

        Returns:
            ParticipantResponse: 參與者回應
        """
        # 查詢挑戰
        challenge = await self.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise ValueError("Challenge not found")

        # 檢查是否已開始
        if challenge["status"] != "upcoming":
            raise ValueError("Cannot join challenge after it has started")

        # 檢查參與人數上限
        if challenge["participant_count"] >= 20:
            raise ValueError("Challenge is full (max 20 participants)")

        # 檢查是否已參與
        existing = await self.participants.find_one({
            "challenge_id": ObjectId(challenge_id),
            "user_id": ObjectId(user_id)
        })

        if existing:
            raise ValueError("Already joined this challenge")

        # 檢查權限 (私密挑戰需要檢查是否為好友)
        if challenge["privacy"] == "private":
            is_friend = await self._is_friend(str(challenge["creator_id"]), user_id)
            if not is_friend:
                raise ValueError("Cannot join private challenge (not friends with creator)")

        # 加入挑戰
        await self._add_participant(challenge_id, user_id)

        # 更新參與人數
        await self.challenges.update_one(
            {"_id": ObjectId(challenge_id)},
            {"$inc": {"participant_count": 1}}
        )

        # 查詢使用者資料
        user = await self.users.find_one({"_id": ObjectId(user_id)})

        return ParticipantResponse(
            user_id=user_id,
            display_name=user.get("display_name", ""),
            avatar_url=user.get("avatar_url"),
            joined_at=datetime.now(timezone.utc),
            current_progress=0,
            completion_percentage=0,
            rank=None,
            status="active"
        )

    async def leave_challenge(
        self,
        user_id: str,
        challenge_id: str
    ):
        """
        退出挑戰賽

        Args:
            user_id: 使用者 ID
            challenge_id: 挑戰 ID
        """
        # 查詢參與記錄
        participant = await self.participants.find_one({
            "challenge_id": ObjectId(challenge_id),
            "user_id": ObjectId(user_id)
        })

        if not participant:
            raise ValueError("Not a participant of this challenge")

        # 更新狀態為 withdrawn
        await self.participants.update_one(
            {"_id": participant["_id"]},
            {"$set": {"status": "withdrawn"}}
        )

        # 更新挑戰參與人數
        await self.challenges.update_one(
            {"_id": ObjectId(challenge_id)},
            {"$inc": {"participant_count": -1}}
        )

    async def delete_challenge(
        self,
        user_id: str,
        challenge_id: str
    ):
        """
        刪除挑戰賽（僅創建者可操作，挑戰開始後無法刪除）

        Args:
            user_id: 使用者 ID
            challenge_id: 挑戰 ID
        """
        # 查詢挑戰
        challenge = await self.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise ValueError("Challenge not found")

        # 檢查權限
        if str(challenge["creator_id"]) != user_id:
            raise ValueError("Only creator can delete challenge")

        # 檢查是否已開始
        if challenge["status"] != "upcoming":
            raise ValueError("Cannot delete challenge after it has started")

        # 刪除挑戰
        await self.challenges.delete_one({"_id": ObjectId(challenge_id)})

        # 刪除所有參與記錄
        await self.participants.delete_many({"challenge_id": ObjectId(challenge_id)})

    async def get_leaderboard(
        self,
        challenge_id: str
    ) -> Dict:
        """
        T244: 排名計算邏輯

        取得挑戰賽即時排名
        - 每日批次更新（凌晨 2:00）
        - 依挑戰目標排序參與者

        Args:
            challenge_id: 挑戰 ID

        Returns:
            Dict: 排行榜資料
        """
        # 查詢挑戰
        challenge = await self.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            raise ValueError("Challenge not found")

        # 查詢參與者（依排名排序）
        participants_cursor = self.participants.find({
            "challenge_id": ObjectId(challenge_id),
            "status": {"$in": ["active", "completed"]}
        }).sort("rank", 1)

        participants = await participants_cursor.to_list(length=100)

        # 組裝排行榜
        leaderboard_entries = []
        for p in participants:
            user = await self.users.find_one({"_id": p["user_id"]})
            if user:
                leaderboard_entries.append(LeaderboardEntry(
                    rank=p.get("rank", 0),
                    user_id=str(p["user_id"]),
                    display_name=user.get("display_name", ""),
                    avatar_url=user.get("avatar_url"),
                    current_progress=p["current_progress"],
                    completion_percentage=p["completion_percentage"],
                    badge=p.get("badge")
                ))

        return {
            "challenge_id": challenge_id,
            "challenge_type": challenge["challenge_type"],
            "target_value": challenge["target_value"],
            "participants": leaderboard_entries,
            "last_updated": datetime.now(timezone.utc)
        }

    async def update_participant_progress(
        self,
        challenge_id: str,
        user_id: str
    ):
        """
        T244: 排名計算邏輯

        更新參與者進度（通常由定時任務觸發）

        Args:
            challenge_id: 挑戰 ID
            user_id: 使用者 ID
        """
        # 查詢挑戰
        challenge = await self.challenges.find_one({"_id": ObjectId(challenge_id)})
        if not challenge:
            return

        # 計算進度
        progress = await self._calculate_progress(
            user_id,
            challenge["challenge_type"],
            challenge["start_date"],
            challenge["end_date"],
            challenge.get("workout_type")
        )

        # 計算完成百分比
        completion_percentage = min((progress / challenge["target_value"]) * 100, 100)

        # 更新參與者資料
        await self.participants.update_one(
            {
                "challenge_id": ObjectId(challenge_id),
                "user_id": ObjectId(user_id)
            },
            {
                "$set": {
                    "current_progress": progress,
                    "completion_percentage": completion_percentage,
                    "last_updated": datetime.now(timezone.utc)
                }
            }
        )

    # Helper methods

    async def _add_participant(self, challenge_id: str, user_id: str):
        """新增參與者"""
        participant = ParticipantInDB(
            challenge_id=ObjectId(challenge_id),
            user_id=ObjectId(user_id),
            joined_at=datetime.now(timezone.utc),
            status="active"
        )

        await self.participants.insert_one(participant.dict(by_alias=True, exclude={"id"}))

    async def _is_friend(self, user_id1: str, user_id2: str) -> bool:
        """檢查是否為好友"""
        count = await self.friendships.count_documents({
            "$or": [
                {"user_id": ObjectId(user_id1), "friend_id": ObjectId(user_id2)},
                {"user_id": ObjectId(user_id2), "friend_id": ObjectId(user_id1)}
            ],
            "status": "accepted"
        })
        return count > 0

    async def _calculate_progress(
        self,
        user_id: str,
        challenge_type: str,
        start_date: datetime,
        end_date: datetime,
        workout_type: Optional[str] = None
    ) -> float:
        """
        計算挑戰進度

        Args:
            user_id: 使用者 ID
            challenge_type: 挑戰類型
            start_date: 開始日期
            end_date: 結束日期
            workout_type: 運動類型（特定運動類型挑戰）

        Returns:
            float: 進度數值
        """
        # 構建查詢條件
        query = {
            "user_id": ObjectId(user_id),
            "start_time": {
                "$gte": start_date,
                "$lte": end_date
            },
            "is_deleted": False
        }

        if challenge_type == "specific_workout_type" and workout_type:
            query["workout_type"] = workout_type

        # 計算進度
        if challenge_type == "total_distance":
            # 總距離 (公里)
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "total": {"$sum": "$distance_km"}}}
            ]
            result = await self.workouts.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0

        elif challenge_type == "total_duration":
            # 總時長 (分鐘)
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "total": {"$sum": "$duration_minutes"}}}
            ]
            result = await self.workouts.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0

        elif challenge_type == "consecutive_days":
            # 連續天數 (需要特殊計算)
            workouts = await self.workouts.find(query).sort("start_time", 1).to_list(length=1000)

            if not workouts:
                return 0

            # 計算最長連續天數
            dates = set()
            for workout in workouts:
                dates.add(workout["start_time"].date())

            sorted_dates = sorted(dates)
            max_streak = 1
            current_streak = 1

            for i in range(1, len(sorted_dates)):
                diff = (sorted_dates[i] - sorted_dates[i-1]).days
                if diff == 1:
                    current_streak += 1
                    max_streak = max(max_streak, current_streak)
                else:
                    current_streak = 1

            return max_streak

        return 0
