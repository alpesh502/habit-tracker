cat > REASONING.md <<'EOF'
# REASONING — HabitFlow 75-Day Habit Tracker

## 1. Understanding the Problem

The application is designed around a 75-day habit challenge. The main requirement is to make daily habit logging simple while providing useful streak information.

The important requirements identified from the problem are:

- Support multiple habits.
- Support daily habits.
- Support weekday-only habits.
- Show today's habits clearly.
- Allow one-click completion.
- Calculate current and best streaks.
- Allow users to search for habits.
- Allow users to update existing habits.
- Allow users to archive habits they have given up.
- Preserve archived habit data instead of permanently deleting it.
- Remind users about habits that are still incomplete in the morning.

The design therefore focuses first on reliable habit logging and streak calculation, followed by usability features.

## 2. Requirement Decisions

### Multiple Habits

The database uses a separate `habits` table instead of hardcoding habits. This allows every user to create any number of habits.

### Habit Scheduling

Each habit has a `schedule` value:

- `daily` — required every day.
- `weekdays` — required Monday through Friday.

This makes streak calculations dependent on the actual habit schedule.

### Completion Logging

Each completion is stored with:

- Habit ID
- Completion date
- Creation timestamp

A unique constraint on `(habit_id, completion_date)` prevents the same habit from being logged twice for the same day.

### Archive Instead of Delete

When a user gives up a habit, the habit is archived using an `active` flag.

The completion records are preserved. This avoids losing historical data and allows the habit to be restored later.

## 3. Streak Calculation Approach

### Current Streak

The current streak is calculated by checking dates backwards from today.

For a daily habit:

- Every calendar day is required.
- The streak stops at the first incomplete required day.

For a weekday habit:

- Monday to Friday are required.
- Saturday and Sunday are skipped.
- The streak stops at the first incomplete weekday.

If today's required habit has not been completed yet, the current streak is evaluated from the previous required day. This avoids treating an unfinished current day as a completed streak day.

### Best Streak

The best streak is calculated by scanning the historical required dates from the habit's creation date through today.

The longest consecutive sequence of completed required days becomes the best streak.

## 4. Backend Design

The backend uses Node.js and Express.

The API is responsible for:

- Habit CRUD operations
- Archive and restore operations
- Completion logging
- Completion removal
- History retrieval
- Dashboard statistics
- Streak calculation

SQLite is used because the application needs a lightweight persistent database without requiring an external database server.

## 5. Frontend Design

The frontend uses React and Vite.

The dashboard provides:

- 75-day challenge heading
- Today's completion summary
- Current and best streak statistics
- Search
- Habit cards
- One-click completion
- Edit and archive actions
- Morning incomplete-habit reminder

The interface is responsive so that the tracker can be used on different screen sizes.

## 6. Morning Reminder

The application checks the dashboard data for habits that are:

- Active
- Required today
- Not completed today

These habits are shown in a morning reminder section with a direct completion action.

Browser notifications are treated as an enhancement rather than the only reminder mechanism. The in-app reminder remains available.

## 7. API and Data Flow

The application follows this flow:

```text
User
 |
 v
React Frontend
 |
 | HTTP REST API
 v
Express Backend
 |
 v
SQLite