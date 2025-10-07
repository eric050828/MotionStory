#!/bin/bash

# TDD Tests Verification Script
# 驗證所有測試檔案已建立並準備好進入 Red 階段

echo "=================================="
echo "TDD Tests Verification (Phase 3.2)"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
total_tests=0
found_tests=0
missing_tests=0

# Backend Contract Tests (T012-T039)
echo "📋 Backend Contract Tests (T012-T039)"
echo "--------------------------------------"

contract_tests=(
  "api/tests/contract/test_auth_contract.py"
  "api/tests/contract/test_workouts_contract.py"
  "api/tests/contract/test_achievements_contract.py"
  "api/tests/contract/test_dashboards_contract.py"
  "api/tests/contract/test_timeline_contract.py"
)

for test_file in "${contract_tests[@]}"; do
  total_tests=$((total_tests + 1))
  if [ -f "$test_file" ]; then
    echo -e "${GREEN}✓${NC} $test_file"
    found_tests=$((found_tests + 1))
  else
    echo -e "${RED}✗${NC} $test_file"
    missing_tests=$((missing_tests + 1))
  fi
done

echo ""

# Backend Unit Tests (T040-T044)
echo "🧪 Backend Unit Tests (T040-T044)"
echo "--------------------------------------"

unit_tests=(
  "api/tests/unit/test_models_validation.py"
  "api/tests/unit/test_security.py"
  "api/tests/unit/test_achievement_service.py"
  "api/tests/unit/test_soft_delete.py"
  "api/tests/unit/test_csv_service.py"
)

for test_file in "${unit_tests[@]}"; do
  total_tests=$((total_tests + 1))
  if [ -f "$test_file" ]; then
    echo -e "${GREEN}✓${NC} $test_file"
    found_tests=$((found_tests + 1))
  else
    echo -e "${RED}✗${NC} $test_file"
    missing_tests=$((missing_tests + 1))
  fi
done

echo ""

# Mobile Component Tests (T045-T049)
echo "📱 Mobile Component Tests (T045-T049)"
echo "--------------------------------------"

mobile_tests=(
  "app/__tests__/screens/LoginScreen.test.tsx"
  "app/__tests__/screens/WorkoutForm.test.tsx"
  "app/__tests__/components/widgets/StreakCounter.test.tsx"
  "app/__tests__/components/CelebrationAnimation.test.tsx"
  "app/__tests__/screens/TimelineScreen.test.tsx"
)

for test_file in "${mobile_tests[@]}"; do
  total_tests=$((total_tests + 1))
  if [ -f "$test_file" ]; then
    echo -e "${GREEN}✓${NC} $test_file"
    found_tests=$((found_tests + 1))
  else
    echo -e "${RED}✗${NC} $test_file"
    missing_tests=$((missing_tests + 1))
  fi
done

echo ""

# Integration Tests (T050-T052)
echo "🔗 Integration Tests (T050-T052)"
echo "--------------------------------------"

integration_tests=(
  "api/tests/integration/test_registration_flow.py"
  "api/tests/integration/test_workout_achievement_flow.py"
  "app/__tests__/integration/test_offline_sync.test.ts"
)

for test_file in "${integration_tests[@]}"; do
  total_tests=$((total_tests + 1))
  if [ -f "$test_file" ]; then
    echo -e "${GREEN}✓${NC} $test_file"
    found_tests=$((found_tests + 1))
  else
    echo -e "${RED}✗${NC} $test_file"
    missing_tests=$((missing_tests + 1))
  fi
done

echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo -e "Total tests expected: ${YELLOW}$total_tests${NC}"
echo -e "Tests found: ${GREEN}$found_tests${NC}"
echo -e "Tests missing: ${RED}$missing_tests${NC}"
echo ""

# Check test file contents
echo "=================================="
echo "Test File Content Verification"
echo "=================================="
echo ""

# Sample check: verify tests import from non-existent modules (TDD principle)
echo "🔍 Checking if tests follow TDD (importing unimplemented modules)..."
echo ""

# Check Backend tests
if [ -f "api/tests/unit/test_security.py" ]; then
  if grep -q "from src.core.security import" "api/tests/unit/test_security.py"; then
    echo -e "${GREEN}✓${NC} test_security.py imports from unimplemented src.core.security"
  fi
fi

if [ -f "api/tests/unit/test_achievement_service.py" ]; then
  if grep -q "from src.services.achievement_service import" "api/tests/unit/test_achievement_service.py"; then
    echo -e "${GREEN}✓${NC} test_achievement_service.py imports from unimplemented src.services.achievement_service"
  fi
fi

# Check Mobile tests
if [ -f "app/__tests__/screens/LoginScreen.test.tsx" ]; then
  if grep -q "from '@/app/screens/LoginScreen'" "app/__tests__/screens/LoginScreen.test.tsx"; then
    echo -e "${GREEN}✓${NC} LoginScreen.test.tsx imports from unimplemented LoginScreen"
  fi
fi

if [ -f "app/__tests__/screens/WorkoutForm.test.tsx" ]; then
  if grep -q "from '@/app/screens/WorkoutForm'" "app/__tests__/screens/WorkoutForm.test.tsx"; then
    echo -e "${GREEN}✓${NC} WorkoutForm.test.tsx imports from unimplemented WorkoutForm"
  fi
fi

echo ""
echo "=================================="
echo "TDD Status"
echo "=================================="

if [ $missing_tests -eq 0 ]; then
  echo -e "${GREEN}✓ All tests created successfully!${NC}"
  echo ""
  echo "📊 Phase 3.2 Status: COMPLETE"
  echo "   - All contract tests written (T012-T039) ✓"
  echo "   - All unit tests written (T040-T044) ✓"
  echo "   - All component tests written (T045-T049) ✓"
  echo "   - All integration tests written (T050-T052) ✓"
  echo ""
  echo "🔴 Next Step: RUN TESTS (Red Phase)"
  echo "   Tests should FAIL because implementations don't exist yet"
  echo ""
  echo "   Backend:  cd api && python -m pytest tests/ -v"
  echo "   Mobile:   cd app && npm test"
  echo ""
  echo "🟢 After Tests Fail: Proceed to Phase 3.3 (Implementation)"
  exit 0
else
  echo -e "${RED}✗ Missing $missing_tests test files!${NC}"
  echo ""
  echo "Please create the missing test files before proceeding."
  exit 1
fi
