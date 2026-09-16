Round 2 is a hands-on "Builder" round that assesses how candidates approach an open-ended, real-world problem.

Duration: The round is 2.5 hours long. Submissions will not be accepted after the 2.5-hour window closes.
Problem statement: Each candidate will be given a short, real-world problem statement. No further explanation or specification will be provided beyond that statement.
Deriving the solution: Candidates are expected to interpret the problem themselves and determine the features and specifications to be implemented. They are free to use any AI assistance or tools (for example, GitHub Copilot) to help infer the requirements and build their solution.
Tech stack: Candidates may use any technology stack they are comfortable with.
Environment: All coding is to be done online using GitHub Codespaces, accessed via the candidate's college email ID.

Problem Assignment: habit_tracker the brief descroipton of projecgt is here:ROUND 2 · BUILD ROUND

Ananya’s 75-day challenge

Ananya has started a 75-day self-improvement challenge — drink water, read, work out, no sugar. She’s juggling several habits at once: some she does every day, some only on weekdays. Each morning she just wants to see today’s habits and tick them off one by one. She’s fiercely proud of her streaks and genuinely gutted when she breaks one, so for every habit she wants to know her current streak and her best-ever streak. Weeks in, her list has grown long — there are a couple she’s quietly given up on and wants out of the way (but not gone forever), and she keeps hunting for a particular one to update it.

Build Ananya something so she keeps her streaks alive.

(As you build, picture Ananya opening this every morning — but build for people like Ananya, not just her: any user, any habits. The small frustrations above are clues to what would make it genuinely useful. Get logging and streaks solid first, then the niceties.)
and at intially understanad the problem and describe hte architecture for it and after that next we can proceed to develop the platform to solve the issue in best way possible and my codespcae setup is this if any requirement then we can edit the codespace again Round 2 is a hands-on "Builder" round that assesses how candidates approach an open-ended, real-world problem.

Duration: The round is 2.5 hours long. Submissions will not be accepted after the 2.5-hour window closes.
Problem statement: Each candidate will be given a short, real-world problem statement. No further explanation or specification will be provided beyond that statement.
Deriving the solution: Candidates are expected to interpret the problem themselves and determine the features and specifications to be implemented. They are free to use any AI assistance or tools (for example, GitHub Copilot) to help infer the requirements and build their solution.
Tech stack: Candidates may use any technology stack they are comfortable with.
Environment: All coding is to be done online using GitHub Codespaces, accessed via the candidate's college email ID.

Problem Assignment: habit_tracker the brief descroipton of projecgt is here:ROUND 2 · BUILD ROUND

Ananya’s 75-day challenge

Ananya has started a 75-day self-improvement challenge — drink water, read, work out, no sugar. She’s juggling several habits at once: some she does every day, some only on weekdays. Each morning she just wants to see today’s habits and tick them off one by one. She’s fiercely proud of her streaks and genuinely gutted when she breaks one, so for every habit she wants to know her current streak and her best-ever streak. Weeks in, her list has grown long — there are a couple she’s quietly given up on and wants out of the way (but not gone forever), and she keeps hunting for a particular one to update it.

Build Ananya something so she keeps her streaks alive.

(As you build, picture Ananya opening this every morning — but build for people like Ananya, not just her: any user, any habits. The small frustrations above are clues to what would make it genuinely useful. Get logging and streaks solid first, then the niceties.)

and at intially understanad the problem and describe hte architecture for it and after that next we can proceed to develop the platform to solve the issue in best way possible

Absolutely. We are now moving from architecture → implementation.

We will implement this in milestones and push after each working milestone, exactly as you wanted.

Milestone 2 — Database + Backend Foundation

For this step we will build:

SQLite Database
      ↓
habits table
      ↓
completions table
      ↓
Express API
      ↓
Health check
      ↓
Habit CRUD

Do not build the UI yet. We want the backend/data layer working first because the problem explicitly says "Get logging and streaks solid first."

Step 1 — Install backend packages

In your Codespace terminal, from:

/workspaces/habit-tracker

run:

cd server
npm install express cors better-sqlite3
cd ..

Then verify:

npm --prefix server list --depth=0

You should see:

express
cors
better-sqlite3
Step 2 — Create the database

Open:

server/db.js

Delete anything currently inside it and paste this:

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDirectory = path.join(__dirname, "data");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const databasePath = path.join(dataDirectory, "habits.db");

const db = new Database(databasePath);

// Better SQLite reliability
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    schedule TEXT NOT NULL DEFAULT 'daily'
      CHECK(schedule IN ('daily', 'weekdays')),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    completion_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (habit_id)
      REFERENCES habits(id)
      ON DELETE CASCADE,

    UNIQUE(habit_id, completion_date)
  );
`);

// Add sample data only when database is empty
const habitCount = db
  .prepare("SELECT COUNT(*) AS count FROM habits")
  .get().count;

if (habitCount === 0) {
  const insertHabit = db.prepare(`
    INSERT INTO habits (name, description, schedule)
    VALUES (?, ?, ?)
  `);

  const seedDatabase = db.transaction(() => {
    insertHabit.run(
      "Drink Water",
      "Drink at least 8 glasses of water",
      "daily"
    );

    insertHabit.run(
      "Read",
      "Read for at least 20 minutes",
      "daily"
    );

    insertHabit.run(
      "Workout",
      "Workout for at least 30 minutes",
      "weekdays"
    );

    insertHabit.run(
      "No Sugar",
      "Avoid added sugar today",
      "daily"
    );
  });

  seedDatabase();
}

export default db;

Save:

Ctrl + S

Step 3 — Create the Express server

Open:

server/index.js

Replace everything with:

import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/*
--------------------------------------------------
HELPER FUNCTIONS
--------------------------------------------------
*/

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isRequiredDay(habit, date) {
  // Daily habit
  if (habit.schedule === "daily") {
    return true;
  }

  // Weekday habit
  const day = date.getDay();

  return day !== 0 && day !== 6;
}

/*
--------------------------------------------------
STREAK CALCULATION
--------------------------------------------------
*/

function calculateStreaks(habit) {
  const completions = db
    .prepare(`
      SELECT completion_date
      FROM completions
      WHERE habit_id = ?
    `)
    .all(habit.id);

  const completedDates = new Set(
    completions.map((item) => item.completion_date)
  );

  const today = new Date();

  /*
  CURRENT STREAK
  */

  let currentStreak = 0;

  for (let i = 0; i < 10000; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() - i);

    // Ignore days that are not required
    if (!isRequiredDay(habit, date)) {
      continue;
    }

    const dateString = formatDate(date);

    if (completedDates.has(dateString)) {
      currentStreak++;
    } else {
      break;
    }
  }

  /*
  BEST STREAK
  */

  const createdDate = new Date(habit.created_at);

  let bestStreak = 0;
  let runningStreak = 0;

  for (
    let date = new Date(createdDate);
    date <= today;
    date.setDate(date.getDate() + 1)
  ) {
    if (!isRequiredDay(habit, date)) {
      continue;
    }

    const dateString = formatDate(date);

    if (completedDates.has(dateString)) {
      runningStreak++;

      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  return {
    currentStreak,
    bestStreak
  };
}

/*
--------------------------------------------------
FORMAT HABIT RESPONSE
--------------------------------------------------
*/

function formatHabit(habit) {
  const streaks = calculateStreaks(habit);

  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    schedule: habit.schedule,
    active: Boolean(habit.active),
    createdAt: habit.created_at,

    currentStreak: streaks.currentStreak,
    bestStreak: streaks.bestStreak
  };
}

/*
--------------------------------------------------
VALIDATION
--------------------------------------------------
*/

function validateHabit(data) {
  const name = String(data.name || "").trim();

  const description = String(
    data.description || ""
  ).trim();

  const schedule =
    data.schedule === "weekdays"
      ? "weekdays"
      : "daily";

  if (!name) {
    return {
      error: "Habit name is required."
    };
  }

  if (name.length > 80) {
    return {
      error: "Habit name must be 80 characters or less."
    };
  }

  if (description.length > 200) {
    return {
      error: "Description must be 200 characters or less."
    };
  }

  return {
    name,
    description,
    schedule
  };
}

/*
--------------------------------------------------
HEALTH CHECK
--------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Habit Tracker API is running"
  });
});

/*
--------------------------------------------------
GET HABITS
--------------------------------------------------
*/

app.get("/api/habits", (req, res) => {
  const search = String(req.query.search || "").trim();

  const archived =
    req.query.archived === "true";

  const activeValue = archived ? 0 : 1;

  const habits = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE active = ?
      AND (
        name LIKE ?
        OR description LIKE ?
      )
      ORDER BY id DESC
    `)
    .all(
      activeValue,
      `%${search}%`,
      `%${search}%`
    );

  res.json(
    habits.map(formatHabit)
  );
});

/*
--------------------------------------------------
CREATE HABIT
--------------------------------------------------
*/

app.post("/api/habits", (req, res) => {
  const validated = validateHabit(req.body);

  if (validated.error) {
    return res.status(400).json({
      error: validated.error
    });
  }

  const result = db
    .prepare(`
      INSERT INTO habits
      (name, description, schedule)
      VALUES (?, ?, ?)
    `)
    .run(
      validated.name,
      validated.description,
      validated.schedule
    );

  const habit = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE id = ?
    `)
    .get(result.lastInsertRowid);

  res.status(201).json(
    formatHabit(habit)
  );
});

/*
--------------------------------------------------
UPDATE HABIT
--------------------------------------------------
*/

app.patch("/api/habits/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Invalid habit ID."
    });
  }

  const validated = validateHabit(req.body);

  if (validated.error) {
    return res.status(400).json({
      error: validated.error
    });
  }

  const result = db
    .prepare(`
      UPDATE habits
      SET
        name = ?,
        description = ?,
        schedule = ?
      WHERE id = ?
    `)
    .run(
      validated.name,
      validated.description,
      validated.schedule,
      id
    );

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  const habit = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE id = ?
    `)
    .get(id);

  res.json(
    formatHabit(habit)
  );
});

/*
--------------------------------------------------
ARCHIVE HABIT
--------------------------------------------------
*/

app.delete("/api/habits/:id", (req, res) => {
  const id = Number(req.params.id);

  const result = db
    .prepare(`
      UPDATE habits
      SET active = 0
      WHERE id = ?
    `)
    .run(id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  res.status(204).send();
});

/*
--------------------------------------------------
COMPLETE HABIT
--------------------------------------------------
*/

app.post("/api/habits/:id/completions", (req, res) => {
  const id = Number(req.params.id);

  const date =
    req.body.date || formatDate(new Date());

  // Basic date validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: "Date must use YYYY-MM-DD format."
    });
  }

  const habit = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE id = ?
    `)
    .get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  /*
  INSERT OR IGNORE makes completion logging
  idempotent.

  The same habit cannot have two completion
  records for the same date.
  */

  db.prepare(`
    INSERT OR IGNORE INTO completions
    (habit_id, completion_date)
    VALUES (?, ?)
  `).run(id, date);

  const updatedHabit = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE id = ?
    `)
    .get(id);

  res.status(201).json(
    formatHabit(updatedHabit)
  );
});

/*
--------------------------------------------------
UNDO COMPLETION
--------------------------------------------------
*/

app.delete(
  "/api/habits/:id/completions/:date",
  (req, res) => {

    const id = Number(req.params.id);
    const date = req.params.date;

    db.prepare(`
      DELETE FROM completions
      WHERE habit_id = ?
      AND completion_date = ?
    `).run(id, date);

    res.status(204).send();
  }
);

/*
--------------------------------------------------
HABIT HISTORY
--------------------------------------------------
*/

app.get("/api/habits/:id/history", (req, res) => {
  const id = Number(req.params.id);

  const days = Math.min(
    Math.max(
      Number(req.query.days || 75),
      1
    ),
    365
  );

  const habit = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE id = ?
    `)
    .get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  const today = new Date();

  const startDate = new Date(today);

  startDate.setDate(
    today.getDate() - days + 1
  );

  const completions = db
    .prepare(`
      SELECT completion_date
      FROM completions
      WHERE habit_id = ?
      AND completion_date >= ?
      ORDER BY completion_date
    `)
    .all(
      id,
      formatDate(startDate)
    );

  res.json(
    completions.map(
      item => item.completion_date
    )
  );
});

/*
--------------------------------------------------
DASHBOARD STATISTICS
--------------------------------------------------
*/

app.get("/api/dashboard", (req, res) => {
  const today = formatDate(new Date());

  const habits = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE active = 1
    `)
    .all();

  let dueToday = 0;
  let completedToday = 0;

  for (const habit of habits) {
    const todayDate = new Date();

    if (
      isRequiredDay(
        habit,
        todayDate
      )
    ) {
      dueToday++;

      const completed =
        db.prepare(`
          SELECT id
          FROM completions
          WHERE habit_id = ?
          AND completion_date = ?
        `).get(
          habit.id,
          today
        );

      if (completed) {
        completedToday++;
      }
    }
  }

  const totalCompletions =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM completions
    `).get().count;

  const completionRate =
    dueToday === 0
      ? 0
      : Math.round(
          (completedToday / dueToday) * 100
        );

  res.json({
    today,
    activeHabits: habits.length,
    dueToday,
    completedToday,
    completionRate,
    totalCompletions
  });
});

/*
--------------------------------------------------
START SERVER
--------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(
    `Habit Tracker API running on port ${PORT}`
  );
});

Save it.

Step 4 — Start the backend

From the root:

npm --prefix server run dev

You should get:

Habit Tracker API running on port 4000

Keep this terminal running.

Step 5 — Test the backend

Open a second terminal in Codespaces.

Run:

curl http://localhost:4000/api/health

Expected:

{
  "success": true,
  "message": "Habit Tracker API is running"
}

Now test the database:

curl http://localhost:4000/api/habits

You should receive the four seeded habits:

Drink Water
Read
Workout
No Sugar

This proves:

Express ✓
SQLite ✓
Database schema ✓
Seed data ✓
REST API ✓
Step 6 — Test creating a habit

Run:

curl -X POST http://localhost:4000/api/habits \
-H "Content-Type: application/json" \
-d '{"name":"Meditate","description":"Meditate for 10 minutes","schedule":"daily"}'

You should get a response containing:

{
  "name": "Meditate",
  "schedule": "daily",
  "currentStreak": 0,
  "bestStreak": 0
}
Step 7 — Test completion logging

First find the ID of Meditate:

curl http://localhost:4000/api/habits

Suppose it is:

5

Then:

curl -X POST http://localhost:4000/api/habits/5/completions \
-H "Content-Type: application/json" \
-d '{"date":"2026-09-16"}'

You should see:

currentStreak: 1
bestStreak: 1

Now run the same command again.

The streak should still be 1, not 2.

That's our idempotency test.

Step 8 — Test the dashboard

Run:

curl http://localhost:4000/api/dashboard

You should get something like:

{
  "today": "2026-09-16",
  "activeHabits": 5,
  "dueToday": 5,
  "completedToday": 1,
  "completionRate": 20,
  "totalCompletions": 1
}
Step 9 — Test the weekday requirement

This is one of the most important requirements from the problem.

Workout is seeded as:

weekdays

The streak engine will treat:

Monday ✓
Tuesday ✓
Wednesday ✓
Thursday ✓
Friday ✓
Saturday -
Sunday -
Monday ✓

as a continuous streak.

The weekend is ignored, not treated as a missed habit.

Step 10 — Commit milestone #2

Once all the tests above work, stop the server with:

Ctrl + C

Then:

git status

You should see:

server/db.js
server/index.js
server/package.json

and possibly package-lock files.

Then:

git add .

Then:

git commit -m "feat: add sqlite database and habit api"

Then:

git push origin main

Finally:

git status

We want:

Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
Our progress after this commit

We'll have:

                 HABITFLOW
                     │
                     ▼
             ┌───────────────┐
             │ SQLite        │
             │               │
             │ habits        │
             │ completions   │
             └───────┬───────┘
                     │
                     ▼
             ┌───────────────┐
             │ Express API   │
             │               │
             │ CRUD          │
             │ Completion    │
             │ Streak Engine │
             │ Search        │
             │ Archive       │
             └───────────────┘

Then Milestone #3 will be the React frontend:

Dashboard
   ↓
Today's habits
   ↓
Mark Done
   ↓
Live streak
   ↓
75-day progress
