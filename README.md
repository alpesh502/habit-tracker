
# HabitFlow — 75-Day Habit Tracker

> **Build habits. Track progress. Keep the streak alive.**

HabitFlow is a full-stack **75-Day Habit Tracker** designed to make daily habit logging simple, fast, and motivating.

The application allows users to create multiple habits, define when those habits should be performed, mark them complete with a single click, monitor streaks, search through a growing habit list, and archive habits without losing their historical data.

The project was developed as part of the **Auriga IT Builder Round**.

---

## The Problem

Building a habit is easy to start but difficult to track consistently.

A useful habit tracker should answer three simple questions immediately:

- **What do I need to do today?**
- **What have I already completed?**
- **How consistent have I been?**

HabitFlow is designed around these questions.

Instead of overwhelming the user with unnecessary features, the dashboard focuses on **today's habits, completion progress, and streaks**.

---

##  Key Features

###  Habit Management

Create and manage multiple habits from a single dashboard.

- Create new habits
- Edit existing habits
- Archive habits
- Restore archived habits
- Preserve historical completion data

###  Flexible Scheduling

Not every habit needs to happen every day.

HabitFlow supports:

- **Daily habits** — required every day
- **Weekday habits** — required Monday to Friday

The schedule is also considered while calculating streaks.

###  One-Click Completion

Logging a habit should not require multiple screens.

Users can complete or undo a habit directly from the dashboard with a single click.

###  Smart Streak Tracking

HabitFlow calculates two important metrics:

**Current Streak**

The number of consecutive required days completed recently.

**Best Streak**

The longest consecutive streak achieved in the available habit history.

Streak calculations are **schedule-aware**, so a weekday habit is not penalized for Saturday or Sunday.

###  Habit Search

As the number of habits grows, finding one should remain easy.

The dashboard provides search functionality based on:

- Habit name
- Habit description

###  Morning Reminder

HabitFlow focuses on the most important part of the day — getting started.

When the dashboard is opened in the morning, the application identifies habits that are:

- Active
- Required today
- Not completed today

These habits are displayed in a dedicated reminder section with a direct **Complete** action.

Browser notifications are supported as a best-effort enhancement when permission is available.

###  Archive Instead of Delete

Giving up a habit does not mean its history should disappear.

Instead of permanently deleting a habit, HabitFlow archives it.

This means:

```text
Active Habit
     ↓
   Archive
     ↓
Hidden from main dashboard
     ↓
History preserved
     ↓
Can be restored later 

Dashboard

The dashboard is designed around today's progress
┌─────────────────────────────────────────────┐
│              75-DAY CHALLENGE               │
│        Build consistency every day          │
├─────────────────────────────────────────────┤
│                                             │
│  Today's Progress     Current    Best      │
│       80%              🔥 12      🏆 30     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  🌅 Morning Reminder                        │
│  Complete the habits still pending today.  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  🔎 Search habits...       + Add Habit      │
│                                             │
│  ☑ Drink Water                  🔥 12       │
│  ☑ Read 20 Pages                🔥 8        │
│  ☐ Exercise                     🔥 5        │
│                                             │
└─────────────────────────────────────────────┘



System Architecture

HabitFlow follows a simple three-layer architecture:
                    ┌─────────────────────┐
                    │      User           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React + Vite        │
                    │ Frontend            │
                    └──────────┬──────────┘
                               │
                         REST API / HTTP
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Node.js + Express   │
                    │ Backend             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ SQLite              │
                    │ Persistent Storage  │
                    └─────────────────────┘



Tech Stack
Frontend
Technology	Purpose
React	Interactive user interface
Vite	Frontend development/build tooling
JavaScript	Application logic
CSS	Responsive UI styling
Backend
Technology	Purpose
Node.js	Server runtime
Express.js	REST API
CORS	Frontend/backend communication
Database
Technology	Purpose
SQLite	Lightweight persistent database
better-sqlite3	SQLite integration with Node.js
 Database Design

HabitFlow uses two core tables.

habits

Stores the definition and current state of each habit.

id
name
description
schedule
active
created_at

The schedule field supports:

daily
weekdays

The active field controls whether the habit is currently visible in the active dashboard.

completions

Stores completion events.

id
habit_id
completion_date
created_at

A unique constraint is applied to:

(habit_id, completion_date)

This prevents duplicate completion records for the same habit on the same date.

🔥 Streak Algorithm

Streak calculation is one of the core parts of the application.

Daily Habit

For a daily habit:

Monday    ✅
Tuesday   ✅
Wednesday ✅
Thursday  ✅
Friday    ❌

The streak stops at the first required incomplete day.

Weekday Habit

For a weekday habit:

Monday    ✅
Tuesday   ✅
Wednesday ✅
Thursday  ✅
Friday    ✅
Saturday  -
Sunday    -
Monday    ✅

Saturday and Sunday are not required days, so they do not break the streak.

Current Streak

The application checks required dates backwards from the current date and counts consecutive completed required days.

Best Streak

The application scans the available historical required dates and tracks the longest consecutive completed sequence.

This makes the streak logic consistent with the user's selected habit schedule.

🔌 REST API
Method	Endpoint	Description
GET	/api/health	Check API status
GET	/api/habits	Get active habits
GET	/api/habits?search=water	Search habits
GET	/api/habits?archived=true	Get archived habits
POST	/api/habits	Create a habit
PATCH	/api/habits/:id	Update a habit
DELETE	/api/habits/:id	Archive a habit
PATCH	/api/habits/:id/restore	Restore a habit
GET	/api/habits/:id/completions	Get completion records
POST	/api/habits/:id/completions	Complete a habit
DELETE	/api/habits/:id/completions/:date	Undo completion
GET	/api/habits/:id/history?days=75	Get habit history
GET	/api/dashboard	Get dashboard summary
🔄 Example Data Flow

When a user clicks Complete:

User clicks "Complete"
        ↓
React sends POST request
        ↓
Express receives habit ID + date
        ↓
Backend validates the request
        ↓
SQLite stores completion
        ↓
Streak is recalculated
        ↓
Updated data returned to React
        ↓
Dashboard refreshes

The completion operation is protected by the database uniqueness constraint, making repeated logging for the same date safe.

📁 Project Structure
habit-tracker/
│
├── client/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── data/
│   ├── db.js
│   ├── index.js
│   └── package.json
│
├── AI_LOGS.md
├── README.md
├── REASONING.md
├── package.json
└── .gitignore
