# Development Summary — HabitFlow

## Original Prompt / Requirement

Build a 75-day habit tracker application for Ananya's 75-day challenge.

The application should support:

- Multiple habits
- Daily habits
- Weekday-only habits
- Today's morning dashboard
- One-click habit completion
- Current streak
- Best-ever streak
- Search/filter for a large habit list
- Updating existing habits
- Archiving habits that the user has given up
- Preserving archived habit history
- Morning reminders for habits that are still incomplete

The implementation should focus first on reliable logging and streak calculations, followed by usability improvements.

## Solution Designed

A full-stack application named HabitFlow was designed using:

- React + Vite for the frontend
- Node.js + Express for the backend
- SQLite + better-sqlite3 for persistent storage
- REST APIs for frontend/backend communication

Architecture:

React + Vite
        |
        | REST API
        v
Node.js + Express
        |
        v
SQLite

## Database Design

Two main tables were used.

### habits

```sql
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  schedule TEXT NOT NULL CHECK(schedule IN ('daily', 'weekdays')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);