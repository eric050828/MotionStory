"""
T198: Friends Contract - 好友邀請端點測試
基於 contracts/friends.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def second_user_headers(client: AsyncClient) -> dict:
    """建立第二個測試使用者"""
    register_data = {
        "email": "friend@example.com",
        "password": "SecurePass123",
        "display_name": "Friend User"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 201

    data = response.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


@pytest.fixture
async def second_user_id(second_user_headers: dict, client: AsyncClient) -> str:
    """取得第二個使用者 ID"""
    response = await client.get("/api/v1/auth/me", headers=second_user_headers)
    assert response.status_code == 200
    return response.json()["user"]["id"]


@pytest.mark.asyncio
class TestFriendsInviteContract:
    """POST /friends/invite 契約測試"""

    async def test_send_invite_success(
        self, client: AsyncClient, auth_headers: dict, second_user_id: str
    ):
        """發送好友邀請 - 成功"""
        response = await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": second_user_id},
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert "friendship_id" in data
        assert data["status"] == "pending"

    async def test_send_invite_duplicate(
        self, client: AsyncClient, auth_headers: dict, second_user_id: str
    ):
        """發送好友邀請 - 重複邀請返回錯誤"""
        # 第一次邀請
        await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": second_user_id},
            headers=auth_headers
        )

        # 第二次邀請應該失敗
        response = await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": second_user_id},
            headers=auth_headers
        )

        assert response.status_code == 400

    async def test_send_invite_self(self, client: AsyncClient, auth_headers: dict, test_user_id: str):
        """發送好友邀請 - 不能邀請自己"""
        response = await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": test_user_id},
            headers=auth_headers
        )

        assert response.status_code == 400

    async def test_send_invite_invalid_id(self, client: AsyncClient, auth_headers: dict):
        """發送好友邀請 - 無效的使用者 ID 返回 400"""
        response = await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": "invalid_id"},
            headers=auth_headers
        )

        assert response.status_code in [400, 404]

    async def test_send_invite_nonexistent_user(self, client: AsyncClient, auth_headers: dict):
        """發送好友邀請 - 不存在的使用者返回 404"""
        response = await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": "507f1f77bcf86cd799439099"},
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_send_invite_unauthorized(self, client: AsyncClient):
        """發送好友邀請 - 未授權返回 401"""
        response = await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": "507f1f77bcf86cd799439011"}
        )

        assert response.status_code == 401

    async def test_friendship_schema(
        self, client: AsyncClient, auth_headers: dict, second_user_id: str
    ):
        """發送好友邀請 - 回應符合 Friendship schema"""
        response = await client.post(
            "/api/v1/friends/invite",
            json={"friend_id": second_user_id},
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()

        assert "friendship_id" in data
        assert "user_id" in data
        assert "friend_id" in data
        assert "status" in data
        assert "invited_at" in data
        assert data["status"] in ["pending", "accepted", "rejected"]
