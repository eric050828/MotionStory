# Tasks: MotionStory Phase 3 - Social Features

**Input**: Design documents from `/specs/001-motionstory/` + Phase 3 spec (FR-036~050)
**Prerequisites**:
- Phase 1-2 complete (T001-T180) ✅
- Design docs expanded (T181-T196) ✅
- All 6 API contracts created ✅
- All 9 Collections documented ✅
- Quickstart scenario 4 added ✅

**Status**: Phase 3 API contracts complete (T190-T195 ✅), ready for TDD implementation (T197~T315, 119 tasks)

---

## Task Overview

- **Phase 3 任務數**: 119 tasks (T197~T315)
- **預估時程**: 10-15 天 (1-2 位開發者)
- **平行任務**: ~45 tasks [P]
- **序列任務**: ~74 tasks

---

## Path Conventions

```
api/                          # Backend (Python FastAPI)
├── src/
│   ├── models/              # Phase 3: friendship, challenge, notification, social
│   ├── services/            # Phase 3: friend, challenge, notification, social services
│   ├── routers/             # Phase 3: friends, challenges, notifications, social routers
│   └── utils/               # Phase 3: fcm_helper (Firebase Cloud Messaging)
└── tests/
    ├── contract/            # Phase 3: 11 個契約測試檔案
    ├── unit/                # Phase 3: 社交邏輯單元測試
    └── integration/         # Phase 3: 珍妮場景整合測試

app/                          # Mobile (React Native + Expo)
├── src/
│   ├── screens/social/      # Phase 3: 社交畫面目錄
│   ├── components/social/   # Phase 3: 社交元件
│   ├── services/api/        # Phase 3: 擴充 API client
│   └── store/               # Phase 3: social stores
└── __tests__/
    ├── unit/                # Phase 3: 社交元件測試
    └── e2e/                 # Phase 3: 珍妮場景 E2E 測試
```

---

## Phase 3.2: Tests First (TDD) (2-3 天)

**⚠️ CRITICAL: 所有測試必須先寫完並失敗 (紅燈階段)，才能進入 Phase 3.3/3.4 實作**

### Contract Tests (基於 6 個 API 契約檔案)

- [X] **T197** [P] Friends Contract: 搜尋好友端點 - `api/tests/contract/test_friends_search.py`
- [X] **T198** [P] Friends Contract: 好友邀請端點 - `api/tests/contract/test_friends_invite.py`
- [X] **T199** [P] Friends Contract: 好友清單查詢 - `api/tests/contract/test_friends_list.py`
- [X] **T200** [P] Social Contract: 好友動態牆 - `api/tests/contract/test_social_feed.py`
- [X] **T201** [P] Social Contract: 按讚與留言 - `api/tests/contract/test_social_interactions.py`
- [X] **T202** [P] Challenges Contract: 創建挑戰賽 - `api/tests/contract/test_challenges_create.py`
- [X] **T203** [P] Challenges Contract: 加入與離開挑戰 - `api/tests/contract/test_challenges_join.py`
- [X] **T204** [P] Challenges Contract: 挑戰排行榜 - `api/tests/contract/test_challenges_leaderboard.py`
- [X] **T205** [P] Notifications Contract: 通知查詢與管理 - `api/tests/contract/test_notifications.py`
- [X] **T206** [P] Leaderboard Contract: 好友排行榜 - `api/tests/contract/test_leaderboard.py`
- [X] **T207** [P] Profiles Contract: 個人檔案公開化 - `api/tests/contract/test_profiles.py`

### Backend Unit Tests

- [X] **T208** [P] Friendship Model 驗證測試 - `api/tests/unit/test_friendship_model.py`
- [X] **T209** [P] Challenge Model 驗證測試 - `api/tests/unit/test_challenge_model.py`
- [X] **T210** [P] Notification Model 驗證測試 - `api/tests/unit/test_notification_model.py`
- [X] **T211** [P] Friend Service 邏輯測試 - `api/tests/unit/test_friend_service.py`
- [X] **T212** [P] Challenge Service 邏輯測試 - `api/tests/unit/test_challenge_service.py`
- [X] **T213** [P] Notification Service 邏輯測試 - `api/tests/unit/test_notification_service.py`

### Mobile Component Tests

- [ ] **T214** [P] FriendList 元件測試 - `app/__tests__/unit/components/social/FriendList.test.tsx`
- [ ] **T215** [P] ActivityFeed 元件測試 - `app/__tests__/unit/components/social/ActivityFeed.test.tsx`
- [ ] **T216** [P] ChallengeCard 元件測試 - `app/__tests__/unit/components/social/ChallengeCard.test.tsx`

### Integration Tests (基於珍妮場景)

- [ ] **T217** [P] 場景 4: 珍妮的社交互動 - `api/tests/integration/test_scenario_social.py`

---

## Phase 3.3: Backend Implementation (5-7 天)

### MongoDB Models (9 個新 Collections)

- [X] **T218** [P] Friendship Model - `api/src/models/friendship.py`
- [X] **T219** [P] Activity Model - `api/src/models/activity.py`
- [X] **T220** [P] Like Model - `api/src/models/like.py`
- [X] **T221** [P] Comment Model - `api/src/models/comment.py`
- [X] **T222** [P] Challenge Model - `api/src/models/challenge.py`
- [X] **T223** [P] Participant Model - `api/src/models/participant.py`
- [X] **T224** [P] Notification Model - `api/src/models/notification.py`
- [X] **T225** [P] Leaderboard Model - `api/src/models/leaderboard.py`
- [X] **T226** [P] BlockList Model - `api/src/models/blocklist.py`

### Database Indexes (9 個 Collections)

- [X] **T227** Friendships Collection 索引設定 - `api/src/core/database.py`
- [X] **T228** Activities Collection 索引設定 - `api/src/core/database.py`
- [X] **T229** Likes Collection 索引設定 - `api/src/core/database.py`
- [X] **T230** Comments Collection 索引設定 - `api/src/core/database.py`
- [X] **T231** Challenges Collection 索引設定 - `api/src/core/database.py`
- [X] **T232** Participants Collection 索引設定 - `api/src/core/database.py`
- [X] **T233** Notifications Collection 索引設定 - `api/src/core/database.py`
- [X] **T234** Leaderboards Collection 索引設定 - `api/src/core/database.py`
- [X] **T235** BlockList Collection 索引設定 - `api/src/core/database.py`

### Service Layer (Business Logic)

- [X] **T236** Friend Service: 好友搜尋邏輯 - `api/src/services/friend_service.py`
- [X] **T237** Friend Service: 好友邀請與接受 - `api/src/services/friend_service.py`
- [X] **T238** Friend Service: 封鎖機制 - `api/src/services/friend_service.py`
- [X] **T239** Social Service: 好友動態牆 (Cursor Pagination) - `api/src/services/social_service.py`
- [X] **T240** Social Service: 按讚與留言邏輯 - `api/src/services/social_service.py`
- [X] **T241** Social Service: 內容審核 (敏感詞過濾) - `api/src/services/social_service.py`
- [X] **T242** Challenge Service: 創建與管理挑戰賽 - `api/src/services/challenge_service.py`
- [X] **T243** Challenge Service: 參與者管理 - `api/src/services/challenge_service.py`
- [X] **T244** Challenge Service: 排名計算邏輯 - `api/src/services/challenge_service.py`
- [X] **T245** Notification Service: 通知觸發邏輯 - `api/src/services/notification_service.py`
- [X] **T246** Notification Service: Firebase Cloud Messaging 整合 - `api/src/services/notification_service.py`
- [X] **T247** Leaderboard Service: 好友排行榜計算 - `api/src/services/leaderboard_service.py`
- [X] **T248** Scheduled Tasks: 稀有成就每日批次計算 (APScheduler) - `api/src/services/achievement_service.py`

### API Routers (25+ Endpoints)

- [X] **T249** Friends Router: POST /friends/search - `api/src/routers/friends.py`
- [X] **T250** Friends Router: POST /friends/invite - `api/src/routers/friends.py`
- [X] **T251** Friends Router: GET /friends - `api/src/routers/friends.py`
- [X] **T252** Friends Router: POST /friends/{id}/accept - `api/src/routers/friends.py`
- [X] **T253** Friends Router: POST /friends/{id}/reject - `api/src/routers/friends.py`
- [X] **T254** Friends Router: DELETE /friends/{id} - `api/src/routers/friends.py`
- [X] **T255** Friends Router: POST /friends/{id}/block - `api/src/routers/friends.py`
- [X] **T256** Friends Router: GET /friends/requests - `api/src/routers/friends.py`
- [X] **T257** Social Router: GET /social/feed - `api/src/routers/social.py`
- [X] **T258** Social Router: POST /activities/{id}/like - `api/src/routers/social.py`
- [X] **T259** Social Router: DELETE /activities/{id}/like - `api/src/routers/social.py`
- [X] **T260** Social Router: POST /activities/{id}/comment - `api/src/routers/social.py`
- [X] **T261** Social Router: GET /activities/{id}/comments - `api/src/routers/social.py`
- [X] **T262** Challenges Router: POST /challenges - `api/src/routers/challenges.py`
- [X] **T263** Challenges Router: GET /challenges - `api/src/routers/challenges.py`
- [X] **T264** Challenges Router: GET /challenges/{id} - `api/src/routers/challenges.py`
- [X] **T265** Challenges Router: POST /challenges/{id}/join - `api/src/routers/challenges.py`
- [X] **T266** Challenges Router: POST /challenges/{id}/leave - `api/src/routers/challenges.py`
- [X] **T267** Challenges Router: GET /challenges/{id}/leaderboard - `api/src/routers/challenges.py`
- [X] **T268** Notifications Router: GET /notifications - `api/src/routers/notifications.py`
- [X] **T269** Notifications Router: PUT /notifications/{id}/read - `api/src/routers/notifications.py`
- [X] **T270** Notifications Router: PUT /notifications/preferences - `api/src/routers/notifications.py`
- [X] **T271** Leaderboard Router: GET /leaderboard/friends - `api/src/routers/leaderboard.py`
- [X] **T272** Profiles Router: GET /profiles/{user_id} - `api/src/routers/profiles.py`
- [X] **T273** Profiles Router: PUT /profiles/me - `api/src/routers/profiles.py`

### External Integrations

- [X] **T274** Firebase Cloud Messaging Helper - `api/src/utils/fcm_helper.py`
- [X] **T275** 分享卡片生成 (5 種模板) - `api/src/utils/share_card_generator.py`

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

### Deployment & Validation

- [ ] **T313** Backend: 部署 Phase 3 至 Render - `api/render.yaml`
- [ ] **T314** Mobile: 更新 Expo Build 配置 - `app/eas.json`
- [ ] **T315** 效能驗證: 通知延遲 < 30 秒, 分享卡片 < 2 秒 - Performance testing

---

## Dependencies Diagram

```
Tests First (T197-T217) ⚠️ MUST FAIL FIRST
  ↓
Backend Models (T218-T226) [9 models in parallel]
  ↓
Database Indexes (T227-T235) [Sequential per model]
  ↓
Backend Services (T236-T248) [Logic depends on models]
  ↓
Backend Routers (T249-T273) [Endpoints depend on services]
  ↓
External Integrations (T274-T275) [Parallel]
  ↓
Mobile Types (T276-T278) [Parallel]
  ↓
Mobile API Client (T279-T283) [Parallel, depends on types]
  ↓
Mobile Stores (T284-T287) [Parallel, depends on API client]
  ↓
Mobile Components (T288-T293) [Parallel, depends on stores]
  ↓
Mobile Screens (T294-T302) [Sequential, depends on components]
  ↓
Native Integration (T303-T304) [Parallel]
  ↓
Navigation (T305) [Depends on screens]
  ↓
E2E Tests & Polish (T306-T315) [After all implementation]
```

---

## Parallel Execution Examples

### 範例 1: Contract Tests (11 個測試可平行)

```bash
Task: "Friends Contract: 搜尋好友端點 - api/tests/contract/test_friends_search.py"
Task: "Friends Contract: 好友邀請端點 - api/tests/contract/test_friends_invite.py"
Task: "Social Contract: 好友動態牆 - api/tests/contract/test_social_feed.py"
Task: "Challenges Contract: 創建挑戰賽 - api/tests/contract/test_challenges_create.py"
Task: "Notifications Contract: 通知查詢與管理 - api/tests/contract/test_notifications.py"
Task: "Leaderboard Contract: 好友排行榜 - api/tests/contract/test_leaderboard.py"
Task: "Profiles Contract: 個人檔案公開化 - api/tests/contract/test_profiles.py"
```

### 範例 2: Backend Models (9 個 Models 可平行)

```bash
Task: "Friendship Model - api/src/models/friendship.py"
Task: "Activity Model - api/src/models/activity.py"
Task: "Like Model - api/src/models/like.py"
Task: "Comment Model - api/src/models/comment.py"
Task: "Challenge Model - api/src/models/challenge.py"
Task: "Participant Model - api/src/models/participant.py"
Task: "Notification Model - api/src/models/notification.py"
Task: "Leaderboard Model - api/src/models/leaderboard.py"
Task: "BlockList Model - api/src/models/blocklist.py"
```

### 範例 3: Mobile UI Components (6 個元件可平行)

```bash
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

- [x] 所有 contracts/ 契約檔案都有對應測試任務 (T197-T207, 共 11 個)
- [x] 所有新增 Collections 都有 model 任務 (T218-T226, 共 9 個)
- [x] 所有測試任務在實作任務之前 (T197-T217 → T218-T315)
- [x] 平行任務 [P] 確實獨立 (不同檔案、無依賴)
- [x] 每個任務都指定確切檔案路徑
- [x] 沒有任務修改與其他 [P] 任務相同的檔案
- [x] 所有 API endpoints 都有 router 任務 (T249-T273, 25+ endpoints)
- [x] 所有 service layer 邏輯都有對應任務 (T236-T248)

---

## Notes

- **[P] 標記**: 表示可平行執行 (不同檔案、無依賴關係)
- **TDD 流程**: Phase 3.2 測試必須全部失敗後,才能進入 Phase 3.3/3.4 實作
- **Commit 策略**: 每完成一個任務就 commit,保持版本歷史清晰
- **效能驗證**: T307-T310, T315 確保符合憲章要求
- **免費方案優化**: 注意 MongoDB 512MB、Render 512MB RAM、Firebase 免費方案限制

---

**Based on**:
- Constitution v1.0.0 (TDD NON-NEGOTIABLE)
- plan.md (Phase 3 Technical Context & Project Structure)
- spec.md (FR-036~050, Phase 3 User Scenarios)
- data-model.md (9 個新 Collections 設計)
- contracts/ (6 個新 API 契約檔案)
- quickstart.md (珍妮場景 4)
