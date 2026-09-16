cat > README.md <<'EOF'
# HabitFlow — 75-Day Habit Tracker

A full-stack habit tracking application built for the Auriga IT Builder Round. HabitFlow helps users manage daily and weekday-only habits, track completions, maintain streaks, and receive a morning reminder for habits that are still incomplete.

## Features

- Create, edit, and archive habits
- Daily and weekday-only schedules
- One-click habit completion
- Current streak and best-ever streak tracking
- Search habits by name or description
- Morning reminder for incomplete habits
- Restore archived habits through the API
- Preserve completion history when a habit is archived
- 75-day challenge focused dashboard
- Responsive and clean user interface

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- REST API

### Database
- SQLite
- better-sqlite3

## Architecture

```text
React + Vite
     |
     | REST API
     v
Node.js + Express
     |
     v
SQLite Database