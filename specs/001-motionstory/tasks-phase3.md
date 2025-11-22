# Tasks: MotionStory Phase 3 - Social Features

**Input**: Design documents from `/specs/001-motionstory/` + Phase 3 spec (FR-036~050)
**Prerequisites**: Phase 1-2 complete (180/180 tasks) ✅, plan.md updated ✅, spec.md extended ✅

**Status**: Phase 3 implementation tasks (T181~T280)

## 任務總覽

- **Phase 3 任務數**: 100 tasks (T181~T280)
- **預估時程**: 10-15 天 (1-2 位開發者)
- **平行任務**: ~35 tasks [P]
- **序列任務**: ~65 tasks

## 技術棧 (Phase 3 新增)

**Backend**:
- Firebase Cloud Messaging (推播通知)
- APScheduler (定時任務：稀有成就計算)

**Mobile**:
- React Native Share (原生分享 API)
- React Native Gesture Handler (已安裝，用於拖拉)

## Path Conventions

```
api/                          # Backend (Python FastAPI)
├── src/
│   ├── models/              # Phase 3: 新增 friendship, challenge, notification, social
│   ├── services/            # Phase 3: 新增 friend, challenge, notification, social services
│   ├── routers/             # Phase 3: 新增 friends, challenges, notifications, social routers
│   └── utils/               # Phase 3: 新增 fcm_helper (Firebase Cloud Messaging)
└── tests/
    ├── contract/            # Phase 3: 新增 6 個契約測試檔案
    ├── unit/                # Phase 3: 社交邏輯單元測試
    └── integration/         # Phase 3: 珍妮場景整合測試

app/                          # Mobile (React Native + Expo)
├── src/
│   ├── screens/social/      # Phase 3: 新增社交畫面目錄
│   ├── components/social/   # Phase 3: 社交元件
│   ├── services/api/        # Phase 3: 擴充 API client
│   └── store/               # Phase 3: 新增 social stores
└── __tests__/
    ├── unit/                # Phase 3: 社交元件測試
    └── e2e/                 # Phase 3: 珍妮場景 E2E 測試
```

---

## Phase 3.1: Design Documents Expansion (3-5 天)

**⚠️ CRITICAL**: 這些設計文件必須在實作前完成

### Data Model Expansion

- [X] **T181** [P] 擴充 data-model.md - 新增 Friendships Collection - `specs/001-motionstory/data-model.md`
  - 欄位: user_id (邀請者), friend_id (被邀請者), status (pending/accepted/rejected), invited_at, accepted_at, last_interaction_at
  - 索引: user_id+friend_id (唯一), user_id+status, friend_id+status

- [X] **T182** [P] 擴充 data-model.md - 新增 Activities Collection - `specs/001-motionstory/data-model.md`
  - 欄位: user_id, activity_type (workout/achievement/challenge), reference_id, visibility (public/friends/private), created_at
  - 索引: user_id+created_at, created_at (好友動態查詢)

- [X] **T183** [P] 擴充 data-model.md - 新增 Likes Collection - `specs/001-motionstory/data-model.md`
  - 欄位: user_id, target_type (workout/activity), target_id, liked_at
  - 索引: target_type+target_id, user_id+target_type+target_id (唯一)

- [X] **T184** [P] 擴充 data-model.md - 新增 Comments Collection - `specs/001-motionstory/data-model.md`
  - 欄位: user_id, target_type (workout/activity), target_id, content (max 200 chars), status (normal/filtered/reported), created_at, parent_id (回覆)
  - 索引: target_type+target_id+created_at, user_id+created_at

- [X] **T185** [P] 擴充 data-model.md - 新增 Challenges Collection - `specs/001-motionstory/data-model.md`
  - 欄位: creator_id, challenge_type (distance/duration/streak/type), goal_value, start_date, end_date, visibility (public/private), max_participants (20)
  - 索引: creator_id+start_date, start_date+end_date (進行中的挑戰)

- [X] **T186** [P] 擴充 data-model.md - 新增 Participants Collection - `specs/001-motionstory/data-model.md`
  - 欄位: challenge_id, user_id, joined_at, current_progress, completion_status, rank, rewards
  - 索引: challenge_id+user_id (唯一), challenge_id+rank

- [X] **T187** [P] 擴充 data-model.md - 新增 Notifications Collection - `specs/001-motionstory/data-model.md`
  - 欄位: user_id, notification_type (friend_request/activity/interaction/challenge), content, reference_id, is_read, created_at
  - 索引: user_id+created_at, user_id+is_read+created_at

- [X] **T188** [P] 擴充 data-model.md - 新增 Leaderboards Collection - `specs/001-motionstory/data-model.md`
  - 欄位: user_id, period (week/month/year/all), metric (distance/duration/days/achievements), value, rank, snapshot_at
  - 索引: user_id+period+metric, period+metric+rank

- [X] **T189** [P] 擴充 data-model.md - 新增 BlockList Collection - `specs/001-motionstory/data-model.md`
  - 欄位: user_id (封鎖者), blocked_user_id, reason (optional), blocked_at
  - 索引: user_id+blocked_user_id (唯一), blocked_user_id

### API Contracts Expansion

- [X] **T190** [P] 建立 friends.yaml API 契約 - `specs/001-motionstory/contracts/friends.yaml`
  - 端點: POST /friends/search, POST /friends/invite, GET /friends, DELETE /friends/{id}, POST /friends/{id}/accept, POST /friends/{id}/reject, GET /friends/requests, POST /friends/{id}/block

- [X] **T191** [P] 建立 social.yaml API 契約 - `specs/001-motionstory/contracts/social.yaml`
  - 端點: GET /social/feed, POST /activities/{id}/like, DELETE /activities/{id}/like, POST /activities/{id}/comment, GET /activities/{id}/comments

- [X] **T192** [P] 建立 challenges.yaml API 契約 - `specs/001-motionstory/contracts/challenges.yaml`
  - 端點: POST /challenges, GET /challenges, GET /challenges/{id}, PUT /challenges/{id}, DELETE /challenges/{id}, POST /challenges/{id}/join, POST /challenges/{id}/leave, GET /challenges/{id}/participants, GET /challenges/{id}/leaderboard, POST /challenges/{id}/complete

- [X] **T193** [P] 建立 notifications.yaml API 契約 - `specs/001-motionstory/contracts/notifications.yaml`
  - 端點: GET /notifications, PUT /notifications/{id}/read, PUT /notifications/read-all, DELETE /notifications/{id}, PUT /notifications/preferences

- [X] **T194** [P] 建立 leaderboard.yaml API 契約 - `specs/001-motionstory/contracts/leaderboard.yaml`
  - 端點: GET /leaderboard/friends, GET /leaderboard/global (optional)

- [X] **T195** [P] 建立 profiles.yaml API 契約 - `specs/001-motionstory/contracts/profiles.yaml`
  - 端點: GET /profiles/{user_id}, PUT /profiles/me, GET /profiles/me/qrcode

### Quickstart Expansion

- [X] **T196** 擴充 quickstart.md - 新增珍妮的社交使用者場景 - `specs/001-motionstory/quickstart.md`
  - 場景 4: 珍妮的社交互動體驗
  - 測試步驟: 好友邀請 → 動態按讚留言 → 創建挑戰 → 查看排行榜 → 通知偏好設定
  - API 測試範例: curl + httpx
  - 效能驗證: 好友動態載入 < 200ms, 通知延遲 < 30 秒

---

## Phase 3.2: Tests First (TDD) (2-3 天)

**⚠️ CRITICAL**: 所有測試必須先寫完並失敗 (紅燈階段)，才能進入 Phase 3.3/3.4 實作

### Contract Tests (基於 6 個 API 契約檔案)

- [ ] **T197** [P] Friends Contract: 搜尋好友端點 - `api/tests/contract/test_friends_search.py`
- [ ] **T198** [P] Friends Contract: 好友邀請端點 - `api/tests/contract/test_friends_invite.py`
- [ ] **T199** [P] Friends Contract: 好友清單查詢 - `api/tests/contract/test_friends_list.py`
- [ ] **T200** [P] Social Contract: 好友動態牆 - `api/tests/contract/test_social_feed.py`
- [ ] **T201** [P] Social Contract: 按讚與留言 - `api/tests/contract/test_social_interactions.py`
- [ ] **T202** [P] Challenges Contract: 創建挑戰賽 - `api/tests/contract/test_challenges_create.py`
- [ ] **T203** [P] Challenges Contract: 加入與離開挑戰 - `api/tests/contract/test_challenges_join.py`
- [ ] **T204** [P] Challenges Contract: 挑戰排行榜 - `api/tests/contract/test_challenges_leaderboard.py`
- [ ] **T205** [P] Notifications Contract: 通知查詢與管理 - `api/tests/contract/test_notifications.py`
- [ ] **T206** [P] Leaderboard Contract: 好友排行榜 - `api/tests/contract/test_leaderboard.py`
- [ ] **T207** [P] Profiles Contract: 個人檔案公開化 - `api/tests/contract/test_profiles.py`

### Backend Unit Tests

- [ ] **T208** [P] Friendship Model 驗證測試 - `api/tests/unit/test_friendship_model.py`
- [ ] **T209** [P] Challenge Model 驗證測試 - `api/tests/unit/test_challenge_model.py`
- [ ] **T210** [P] Notification Model 驗證測試 - `api/tests/unit/test_notification_model.py`
- [ ] **T211** [P] Friend Service 邏輯測試 - `api/tests/unit/test_friend_service.py`
- [ ] **T212** [P] Challenge Service 邏輯測試 - `api/tests/unit/test_challenge_service.py`
- [ ] **T213** [P] Notification Service 邏輯測試 - `api/tests/unit/test_notification_service.py`

### Mobile Component Tests

- [ ] **T214** [P] FriendList 元件測試 - `app/__tests__/unit/components/social/FriendList.test.tsx`
- [ ] **T215** [P] ActivityFeed 元件測試 - `app/__tests__/unit/components/social/ActivityFeed.test.tsx`
- [ ] **T216** [P] ChallengeCard 元件測試 - `app/__tests__/unit/components/social/ChallengeCard.test.tsx`

### Integration Tests (基於珍妮場景)

- [ ] **T217** [P] 場景 4: 珍妮的社交互動 - `api/tests/integration/test_scenario_social.py`

---

## Phase 3.3: Backend Implementation (5-7 天)

### MongoDB Models (9 個新 Collections)

- [ ] **T218** [P] Friendship Model - `api/src/models/friendship.py`
- [ ] **T219** [P] Activity Model - `api/src/models/activity.py`
- [ ] **T220** [P] Like Model - `api/src/models/like.py`
- [ ] **T221** [P] Comment Model - `api/src/models/comment.py`
- [ ] **T222** [P] Challenge Model - `api/src/models/challenge.py`
- [ ] **T223** [P] Participant Model - `api/src/models/participant.py`
- [ ] **T224** [P] Notification Model - `api/src/models/notification.py`
- [ ] **T225** [P] Leaderboard Model - `api/src/models/leaderboard.py`
- [ ] **T226** [P] BlockList Model - `api/src/models/blocklist.py`

### Database Indexes (27 個新索引)

- [ ] **T227** Friendships Collection 索引設定 - `api/src/models/friendship.py`
- [ ] **T228** Activities Collection 索引設定 - `api/src/models/activity.py`
- [ ] **T229** Likes Collection 索引設定 - `api/src/models/like.py`
- [ ] **T230** Comments Collection 索引設定 - `api/src/models/comment.py`
- [ ] **T231** Challenges Collection 索引設定 - `api/src/models/challenge.py`
- [ ] **T232** Participants Collection 索引設定 - `api/src/models/participant.py`
- [ ] **T233** Notifications Collection 索引設定 - `api/src/models/notification.py`
- [ ] **T234** Leaderboards Collection 索引設定 - `api/src/models/leaderboard.py`
- [ ] **T235** BlockList Collection 索引設定 - `api/src/models/blocklist.py`

### Service Layer (Business Logic)

- [ ] **T236** Friend Service: 好友搜尋邏輯 - `api/src/services/friend_service.py`
- [ ] **T237** Friend Service: 好友邀請與接受 - `api/src/services/friend_service.py`
- [ ] **T238** Friend Service: 封鎖機制 - `api/src/services/friend_service.py`
- [ ] **T239** Social Service: 好友動態牆 (Cursor Pagination) - `api/src/services/social_service.py`
- [ ] **T240** Social Service: 按讚與留言邏輯 - `api/src/services/social_service.py`
- [ ] **T241** Social Service: 內容審核 (敏感詞過濾) - `api/src/services/social_service.py`
- [ ] **T242** Challenge Service: 創建與管理挑戰賽 - `api/src/services/challenge_service.py`
- [ ] **T243** Challenge Service: 參與者管理 - `api/src/services/challenge_service.py`
- [ ] **T244** Challenge Service: 排名計算邏輯 - `api/src/services/challenge_service.py`
- [ ] **T245** Notification Service: 通知觸發邏輯 - `api/src/services/notification_service.py`
- [ ] **T246** Notification Service: Firebase Cloud Messaging 整合 - `api/src/services/notification_service.py`
- [ ] **T247** Leaderboard Service: 好友排行榜計算 - `api/src/services/leaderboard_service.py`
- [ ] **T248** Scheduled Tasks: 稀有成就每日批次計算 (APScheduler) - `api/src/services/achievement_service.py`

### API Routers (25+ Endpoints)

- [ ] **T249** Friends Router: POST /friends/search - `api/src/routers/friends.py`
- [ ] **T250** Friends Router: POST /friends/invite - `api/src/routers/friends.py`
- [ ] **T251** Friends Router: GET /friends - `api/src/routers/friends.py`
- [ ] **T252** Friends Router: POST /friends/{id}/accept - `api/src/routers/friends.py`
- [ ] **T253** Friends Router: POST /friends/{id}/reject - `api/src/routers/friends.py`
- [ ] **T254** Friends Router: DELETE /friends/{id} - `api/src/routers/friends.py`
- [ ] **T255** Friends Router: POST /friends/{id}/block - `api/src/routers/friends.py`
- [ ] **T256** Friends Router: GET /friends/requests - `api/src/routers/friends.py`
- [ ] **T257** Social Router: GET /social/feed - `api/src/routers/social.py`
- [ ] **T258** Social Router: POST /activities/{id}/like - `api/src/routers/social.py`
- [ ] **T259** Social Router: DELETE /activities/{id}/like - `api/src/routers/social.py`
- [ ] **T260** Social Router: POST /activities/{id}/comment - `api/src/routers/social.py`
- [ ] **T261** Social Router: GET /activities/{id}/comments - `api/src/routers/social.py`
- [ ] **T262** Challenges Router: POST /challenges - `api/src/routers/challenges.py`
- [ ] **T263** Challenges Router: GET /challenges - `api/src/routers/challenges.py`
- [ ] **T264** Challenges Router: GET /challenges/{id} - `api/src/routers/challenges.py`
- [ ] **T265** Challenges Router: POST /challenges/{id}/join - `api/src/routers/challenges.py`
- [ ] **T266** Challenges Router: POST /challenges/{id}/leave - `api/src/routers/challenges.py`
- [ ] **T267** Challenges Router: GET /challenges/{id}/leaderboard - `api/src/routers/challenges.py`
- [ ] **T268** Notifications Router: GET /notifications - `api/src/routers/notifications.py`
- [ ] **T269** Notifications Router: PUT /notifications/{id}/read - `api/src/routers/notifications.py`
- [ ] **T270** Notifications Router: PUT /notifications/preferences - `api/src/routers/notifications.py`
- [ ] **T271** Leaderboard Router: GET /leaderboard/friends - `api/src/routers/leaderboard.py`
- [ ] **T272** Profiles Router: GET /profiles/{user_id} - `api/src/routers/profiles.py`
- [ ] **T273** Profiles Router: PUT /profiles/me - `api/src/routers/profiles.py`

### External Integrations

- [ ] **T274** Firebase Cloud Messaging Helper - `api/src/utils/fcm_helper.py`
- [ ] **T275** 分享卡片生成 (5 種模板) - `api/src/utils/share_card_generator.py`

---

## Phase 3.4: Mobile Implementation (7-10 天)

### TypeScript Types (Phase 3 社交)

- [ ] **T276** [P] Friendship Types - `app/src/types/friendship.ts`
- [ ] **T277** [P] Challenge Types - `app/src/types/challenge.ts`
- [ ] **T278** [P] Notification Types - `app/src/types/notification.ts`

### API Client (擴充)

- [ ] **T279** Friends API Service - `app/src/services/api/friends.ts`
- [ ] **T280** Social API Service - `app/src/services/api/social.ts`
- [ ] **T281** Challenges API Service - `app/src/services/api/challenges.ts`
- [ ] **T282** Notifications API Service - `app/src/services/api/notifications.ts`
- [ ] **T283** Leaderboard API Service - `app/src/services/api/leaderboard.ts`

### Zustand State Management

- [ ] **T284** Friend Store - `app/src/store/friend.ts`
- [ ] **T285** Social Store - `app/src/store/social.ts`
- [ ] **T286** Challenge Store - `app/src/store/challenge.ts`
- [ ] **T287** Notification Store - `app/src/store/notification.ts`

### Social UI Components

- [ ] **T288** [P] FriendListItem - `app/src/components/social/FriendListItem.tsx`
- [ ] **T289** [P] ActivityCard - `app/src/components/social/ActivityCard.tsx`
- [ ] **T290** [P] ChallengeCard - `app/src/components/social/ChallengeCard.tsx`
- [ ] **T291** [P] LeaderboardItem - `app/src/components/social/LeaderboardItem.tsx`
- [ ] **T292** [P] NotificationItem - `app/src/components/social/NotificationItem.tsx`
- [ ] **T293** [P] ShareCardPreview - `app/src/components/social/ShareCardPreview.tsx`

### Main Screens - Social

- [ ] **T294** 好友列表與搜尋畫面 - `app/src/screens/social/FriendsScreen.tsx`
- [ ] **T295** 好友動態牆畫面 - `app/src/screens/social/FeedScreen.tsx`
- [ ] **T296** 挑戰列表畫面 - `app/src/screens/social/ChallengesScreen.tsx`
- [ ] **T297** 創建挑戰畫面 - `app/src/screens/social/CreateChallengeScreen.tsx`
- [ ] **T298** 挑戰詳情與排名 - `app/src/screens/social/ChallengeDetailScreen.tsx`
- [ ] **T299** 好友排行榜畫面 - `app/src/screens/social/LeaderboardScreen.tsx`
- [ ] **T300** 通知中心畫面 - `app/src/screens/social/NotificationsScreen.tsx`
- [ ] **T301** 個人公開檔案畫面 - `app/src/screens/social/ProfileScreen.tsx`
- [ ] **T302** 分享卡片編輯器 - `app/src/screens/social/ShareCardEditorScreen.tsx`

### Native Integration

- [ ] **T303** React Native Share 整合 (4 平台) - `app/src/services/share_service.ts`
- [ ] **T304** Firebase Cloud Messaging 推播通知 - `app/src/services/notification_service.ts`

### Navigation

- [ ] **T305** Social Tab Navigator - `app/src/navigation/SocialNavigator.tsx`

---

## Phase 3.5: Integration & Polish (3-5 天)

### E2E Tests (Detox)

- [ ] **T306** [P] Detox: 珍妮場景 (Week 1-4) - `app/__tests__/e2e/social.e2e.ts`

### Performance Optimization

- [ ] **T307** Backend: 好友動態載入效能 (< 200ms) - `api/src/services/social_service.py`
- [ ] **T308** Backend: 稀有成就批次計算優化 - `api/src/services/achievement_service.py`
- [ ] **T309** Mobile: 分享卡片模板預渲染 - `app/src/components/social/ShareCardPreview.tsx`
- [ ] **T310** Mobile: 好友動態 FlatList 虛擬滾動 - `app/src/screens/social/FeedScreen.tsx`

### Error Handling & Logging

- [ ] **T311** Backend: 社交功能錯誤處理 - `api/src/routers/friends.py, challenges.py, social.py`
- [ ] **T312** Mobile: 社交功能錯誤邊界 - `app/src/components/social/SocialErrorBoundary.tsx`

### Deployment

- [ ] **T313** Backend: 部署 Phase 3 至 Render - `api/render.yaml`
- [ ] **T314** Mobile: 更新 Expo Build 配置 - `app/eas.json`
- [ ] **T315** 效能驗證: 通知延遲 < 30 秒, 分享卡片 < 2 秒 - Performance testing

---

## Dependencies Summary

```
Design Docs (T181~T196)
  ↓
Contract Tests (T197~T207) [Must FAIL before implementation]
  ↓
Backend Unit Tests (T208~T213) [Must FAIL]
  ↓
Mobile Component Tests (T214~T216) [Must FAIL]
  ↓
Integration Tests (T217) [Must FAIL]
  ↓
Backend Models (T218~T235)
  ↓
Backend Services (T236~T248)
  ↓
Backend Routers (T249~T275)
  ↓
Mobile Types (T276~T278) [Parallel]
  ↓
Mobile API Client (T279~T283) [Parallel]
  ↓
Mobile Stores (T284~T287) [Parallel]
  ↓
Mobile UI Components (T288~T293) [Parallel]
  ↓
Mobile Screens (T294~T302)
  ↓
Native Integration (T303~T304)
  ↓
Navigation (T305)
  ↓
E2E Tests & Polish (T306~T315)
```

---

## Parallel Execution Examples

### 範例 1: Design Documents (可完全平行)

```bash
# 同時擴充所有 9 個 Collections
Task: "擴充 data-model.md - 新增 Friendships Collection"
Task: "擴充 data-model.md - 新增 Activities Collection"
Task: "擴充 data-model.md - 新增 Likes Collection"
Task: "擴充 data-model.md - 新增 Comments Collection"
Task: "擴充 data-model.md - 新增 Challenges Collection"
Task: "擴充 data-model.md - 新增 Participants Collection"
Task: "擴充 data-model.md - 新增 Notifications Collection"
Task: "擴充 data-model.md - 新增 Leaderboards Collection"
Task: "擴充 data-model.md - 新增 BlockList Collection"
```

### 範例 2: Contract Tests (11 個測試可平行)

```bash
# 所有 Contract Tests 獨立，可同時寫
Task: "Friends Contract: 搜尋好友端點 - api/tests/contract/test_friends_search.py"
Task: "Friends Contract: 好友邀請端點 - api/tests/contract/test_friends_invite.py"
Task: "Social Contract: 好友動態牆 - api/tests/contract/test_social_feed.py"
Task: "Challenges Contract: 創建挑戰賽 - api/tests/contract/test_challenges_create.py"
Task: "Notifications Contract: 通知查詢與管理 - api/tests/contract/test_notifications.py"
# ... 共 11 個 Contract Tests
```

### 範例 3: Backend Models (9 個 Models 可平行)

```bash
# 所有 Models 獨立檔案，可平行實作
Task: "Friendship Model - api/src/models/friendship.py"
Task: "Activity Model - api/src/models/activity.py"
Task: "Challenge Model - api/src/models/challenge.py"
Task: "Notification Model - api/src/models/notification.py"
# ... 共 9 個 Models
```

### 範例 4: Mobile UI Components (6 個元件可平行)

```bash
# 所有 UI 元件獨立，可同時開發
Task: "FriendListItem - app/src/components/social/FriendListItem.tsx"
Task: "ActivityCard - app/src/components/social/ActivityCard.tsx"
Task: "ChallengeCard - app/src/components/social/ChallengeCard.tsx"
Task: "LeaderboardItem - app/src/components/social/LeaderboardItem.tsx"
Task: "NotificationItem - app/src/components/social/NotificationItem.tsx"
Task: "ShareCardPreview - app/src/components/social/ShareCardPreview.tsx"
```

---

## Validation Checklist

**GATE: 檢查清單**

- [X] 所有 contracts/ 契約檔案都有對應測試任務 (T197-T207, 共 11 個)
- [X] 所有新增 Collections 都有 model 任務 (T218-T226, 共 9 個)
- [X] 所有測試任務在實作任務之前 (T197-T217 → T218-T315)
- [X] 平行任務 [P] 確實獨立 (不同檔案、無依賴)
- [X] 每個任務都指定確切檔案路徑
- [X] 沒有任務修改與其他 [P] 任務相同的檔案

---

## Notes

- **[P] 標記**: 表示可平行執行（不同檔案、無依賴關係）
- **TDD 流程**: Phase 3.2 測試必須全部失敗後，才能進入 Phase 3.3/3.4 實作
- **Commit 策略**: 每完成一個任務就 commit，保持版本歷史清晰
- **效能驗證**: T307-T310 確保符合憲章要求 (動態載入 < 200ms, 通知 < 30 秒, 卡片 < 2 秒)
- **免費方案優化**: 注意 MongoDB 512MB、Render 512MB RAM、Firebase 免費方案限制
- **設計文件優先**: T181-T196 必須完成後才能進入測試與實作

---

**Based on**:
- Constitution v1.0.0 (TDD NON-NEGOTIABLE)
- plan.md (Phase 3 Technical Context & Project Structure)
- spec.md (FR-036~050, Phase 3 User Scenarios)
