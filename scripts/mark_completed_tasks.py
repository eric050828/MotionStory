#!/usr/bin/env python3
"""
Mark completed tasks in tasks.md based on existing files
"""
import os
from pathlib import Path

# Define project root
PROJECT_ROOT = Path(__file__).parent.parent
TASKS_FILE = PROJECT_ROOT / "specs/001-motionstory/tasks.md"

# File existence checks for each task
TASK_FILES = {
    # Phase 3.1 Setup
    "T001": ["api/src", "app/src"],
    "T002": ["app/src"],
    "T003": ["api/requirements.txt", "api/pyproject.toml"],
    "T004": ["app/package.json"],
    "T005": ["api/requirements.txt"],  # Check for dependencies
    "T006": ["app/package.json"],  # Check for dependencies
    "T007": ["api/pyproject.toml"],
    "T008": ["app/.eslintrc.js"],
    "T009": ["api/.env.example"],
    "T010": ["app/.env.example"],
    "T011": ["api/Dockerfile", "api/render.yaml"],
    "T012": ["app/app.json"],
    
    # Phase 3.3 Backend
    "T042": ["api/src/core/config.py"],
    "T043": ["api/src/core/database.py"],
    "T044": ["api/src/core/security.py"],
    "T045": ["api/src/core/deps.py"],
    "T046": ["api/src/main.py"],
    "T047": ["api/src/models/user.py"],
    "T048": ["api/src/models/workout.py"],
    "T049": ["api/src/models/achievement.py"],
    "T050": ["api/src/models/dashboard.py"],
    "T051": ["api/src/models/milestone.py"],
    "T052": ["api/src/models/annual_review.py"],
    "T053": ["api/src/models/share_card.py"],
    "T061": ["api/src/services/security.py"],
    "T063": ["api/src/services/workout_service.py"],
    "T066": ["api/src/services/achievement_service.py"],
    "T069": ["api/src/services/dashboard_service.py"],
    "T071": ["api/src/services/timeline_service.py"],
    "T074": ["api/src/routers/auth.py"],
    "T078": ["api/src/routers/workouts.py"],
    "T086": ["api/src/routers/achievements.py"],
    "T089": ["api/src/routers/dashboards.py"],
    "T094": ["api/src/routers/timeline.py"],
    "T098": ["api/src/core/storage.py"],
    "T099": ["api/src/core/firebase_admin.py"],
    
    # Phase 3.4 Mobile
    "T106": ["app/src/services/api.ts"],
    "T118": ["app/src/store/useAuthStore.ts"],
    "T122": ["app/src/components/Button.tsx"],
    "T123": ["app/src/components/Card.tsx"],
    "T124": ["app/src/components/Input.tsx"],
    "T126": ["app/src/components/CelebrationAnimation.tsx"],
    "T137": ["app/src/components/widgets/StreakCounter.tsx"],
    "T145": ["app/src/screens/LoginScreen.tsx"],
    "T148": ["app/src/screens/WorkoutFormScreen.tsx"],
}

def file_exists(filepath):
    """Check if file exists"""
    full_path = PROJECT_ROOT / filepath
    return full_path.exists()

def mark_tasks_completed():
    """Read tasks.md, mark completed tasks, and write back"""
    with open(TASKS_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    modified = False
    completed_count = 0
    
    for i, line in enumerate(lines):
        # Check if line is a task
        if line.strip().startswith('- [ ]'):
            # Extract task ID
            for task_id, files in TASK_FILES.items():
                if f"**{task_id}**" in line:
                    # Check if all files for this task exist
                    all_exist = all(file_exists(f) for f in files)
                    if all_exist:
                        # Mark as completed
                        lines[i] = line.replace('- [ ]', '- [X]')
                        modified = True
                        completed_count += 1
                        print(f"✓ {task_id}: Marked as completed")
                    break
    
    if modified:
        with open(TASKS_FILE, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"\n✅ Updated {completed_count} tasks in tasks.md")
    else:
        print("No tasks to update")

if __name__ == "__main__":
    mark_tasks_completed()
