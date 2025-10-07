// MongoDB initialization script for local development
// This script is automatically executed when MongoDB container starts

// Switch to motionstory database
db = db.getSiblingDB('motionstory');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firebase_uid', 'email', 'display_name', 'created_at'],
      properties: {
        firebase_uid: {
          bsonType: 'string',
          description: 'Firebase Authentication UID - required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Valid email address - required'
        },
        display_name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Display name - required'
        },
        avatar_url: {
          bsonType: ['string', 'null'],
          description: 'Avatar image URL - optional'
        },
        privacy_settings: {
          bsonType: 'object'
        },
        preferences: {
          bsonType: 'object'
        }
      }
    }
  }
});

db.createCollection('workouts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'workout_type', 'start_time', 'duration_minutes'],
      properties: {
        user_id: {
          bsonType: 'objectId',
          description: 'Reference to users collection - required'
        },
        workout_type: {
          enum: ['running', 'cycling', 'swimming', 'walking', 'hiking', 'yoga', 'gym', 'tennis', 'basketball', 'other'],
          description: 'Workout type - required'
        },
        start_time: {
          bsonType: 'date',
          description: 'Workout start time - required'
        },
        duration_minutes: {
          bsonType: 'int',
          minimum: 1,
          maximum: 600,
          description: 'Workout duration (1-600 minutes) - required'
        },
        distance_km: {
          bsonType: ['double', 'null'],
          minimum: 0,
          maximum: 300,
          description: 'Distance in kilometers (0-300) - optional'
        },
        is_deleted: {
          bsonType: 'bool',
          description: 'Soft delete flag - required'
        }
      }
    }
  }
});

db.createCollection('achievements');
db.createCollection('dashboards');
db.createCollection('milestones');
db.createCollection('annual_reviews');
db.createCollection('share_cards');

// Create indexes
print('Creating indexes...');

// Users indexes
db.users.createIndex({ firebase_uid: 1 }, { unique: true, name: 'idx_firebase_uid' });
db.users.createIndex({ email: 1 }, { unique: true, name: 'idx_email' });

// Workouts indexes
db.workouts.createIndex({ user_id: 1, start_time: -1 }, { name: 'idx_user_time' });
db.workouts.createIndex({ user_id: 1, is_deleted: 1 }, { name: 'idx_user_deleted' });
db.workouts.createIndex(
  { sync_status: 1 },
  { name: 'idx_sync_status', partialFilterExpression: { sync_status: 'pending' } }
);
db.workouts.createIndex(
  { deleted_at: 1 },
  { name: 'idx_deleted_at', partialFilterExpression: { is_deleted: true } }
);

// Achievements indexes
db.achievements.createIndex({ user_id: 1, achieved_at: -1 }, { name: 'idx_user_achieved' });
db.achievements.createIndex(
  { user_id: 1, achievement_type: 1 },
  { unique: true, name: 'idx_user_achievement_type' }
);

// Dashboards indexes
db.dashboards.createIndex({ user_id: 1, order: 1 }, { name: 'idx_user_order' });
db.dashboards.createIndex(
  { user_id: 1, is_default: 1 },
  { name: 'idx_user_default', partialFilterExpression: { is_default: true } }
);

// Milestones indexes
db.milestones.createIndex({ user_id: 1, achieved_at: -1 }, { name: 'idx_user_milestone_time' });
db.milestones.createIndex(
  { user_id: 1, is_featured: 1 },
  { name: 'idx_user_featured', partialFilterExpression: { is_featured: true } }
);

// Annual reviews indexes
db.annual_reviews.createIndex({ user_id: 1, year: 1 }, { unique: true, name: 'idx_user_year' });
db.annual_reviews.createIndex({ cache_expires_at: 1 }, { name: 'idx_cache_expiry' });

// Share cards indexes
db.share_cards.createIndex({ user_id: 1, created_at: -1 }, { name: 'idx_user_created' });
db.share_cards.createIndex({ card_type: 1, related_id: 1 }, { name: 'idx_card_related' });

print('✓ Database initialized successfully');
print('✓ Collections created with validation');
print('✓ Indexes created');
