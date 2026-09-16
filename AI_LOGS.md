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


code part
cat > /tmp/build-habit-tracker.sh <<'SCRIPT'
#!/usr/bin/env bash

set -e

echo "======================================"
echo " Building Habit Tracker"
echo "======================================"

cd /workspaces/habit-tracker

echo "Creating directories..."
mkdir -p client/src server/data

# --------------------------------------------------
# ROOT PACKAGE
# --------------------------------------------------

cat > package.json <<'EOF'
{
  "name": "habit-tracker",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "npm --prefix server run dev",
    "client": "npm --prefix client run dev",
    "build": "npm --prefix client run build",
    "start": "npm --prefix server start"
  },
  "devDependencies": {
    "concurrently": "^9.1.2"
  }
}
EOF

# --------------------------------------------------
# GITIGNORE
# --------------------------------------------------

cat > .gitignore <<'EOF'
node_modules/
server/data/*.db
server/data/*.db-shm
server/data/*.db-wal
client/dist/
.env
*.log
.DS_Store
EOF

# --------------------------------------------------
# SERVER PACKAGE
# --------------------------------------------------

cat > server/package.json <<'EOF'
{
  "name": "habit-tracker-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "cors": "^2.8.5",
    "express": "^4.21.2"
  }
}
EOF

# --------------------------------------------------
# DATABASE
# --------------------------------------------------

cat > server/db.js <<'EOF'
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

const db = new Database(path.join(dataDirectory, "habits.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

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

const count = db.prepare("SELECT COUNT(*) AS count FROM habits").get().count;

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO habits (name, description, schedule)
    VALUES (?, ?, ?)
  `);

  const seed = db.transaction(() => {
    insert.run(
      "Drink Water",
      "Drink at least 8 glasses of water",
      "daily"
    );

    insert.run(
      "Read",
      "Read for at least 20 minutes",
      "daily"
    );

    insert.run(
      "Workout",
      "Workout for at least 30 minutes",
      "weekdays"
    );

    insert.run(
      "No Sugar",
      "Avoid added sugar today",
      "daily"
    );
  });

  seed();
}

export default db;
EOF

# --------------------------------------------------
# SERVER
# --------------------------------------------------

cat > server/index.js <<'EOF'
import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parseDate(value);
  return formatDate(date) === value;
}

function isRequiredDay(habit, date) {
  if (habit.schedule === "daily") {
    return true;
  }

  const day = date.getDay();

  return day !== 0 && day !== 6;
}

function calculateStreaks(habit) {
  const rows = db.prepare(`
    SELECT completion_date
    FROM completions
    WHERE habit_id = ?
    ORDER BY completion_date
  `).all(habit.id);

  const completed = new Set(
    rows.map(row => row.completion_date)
  );

  const today = new Date();

  let currentStreak = 0;

  // A future completion must never affect the current streak.
  for (let i = 0; i < 10000; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    if (!isRequiredDay(habit, date)) {
      continue;
    }

    const dateString = formatDate(date);

    if (completed.has(dateString)) {
      currentStreak++;
    } else {
      break;
    }
  }

  let bestStreak = 0;
  let runningStreak = 0;

  const start = parseDate(
    formatDate(new Date(habit.created_at))
  );

  for (
    let date = new Date(start);
    date <= today;
    date.setDate(date.getDate() + 1)
  ) {
    if (!isRequiredDay(habit, date)) {
      continue;
    }

    const dateString = formatDate(date);

    if (completed.has(dateString)) {
      runningStreak++;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  return {
    currentStreak,
    bestStreak
  };
}

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

function validateHabit(body) {
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();

  if (!name) {
    return { error: "Habit name is required." };
  }

  if (name.length > 80) {
    return { error: "Habit name must be 80 characters or less." };
  }

  if (description.length > 200) {
    return { error: "Description must be 200 characters or less." };
  }

  if (
    body.schedule !== undefined &&
    !["daily", "weekdays"].includes(body.schedule)
  ) {
    return { error: "Schedule must be daily or weekdays." };
  }

  return {
    name,
    description,
    schedule: body.schedule || "daily"
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Habit Tracker API is running"
  });
});

app.get("/api/habits", (req, res) => {
  const search = String(req.query.search || "").trim();
  const archived = req.query.archived === "true";
  const active = archived ? 0 : 1;

  const habits = db.prepare(`
    SELECT *
    FROM habits
    WHERE active = ?
      AND (
        name LIKE ?
        OR description LIKE ?
      )
    ORDER BY created_at DESC
  `).all(
    active,
    `%${search}%`,
    `%${search}%`
  );

  res.json(habits.map(formatHabit));
});

app.post("/api/habits", (req, res) => {
  const data = validateHabit(req.body);

  if (data.error) {
    return res.status(400).json({
      error: data.error
    });
  }

  const result = db.prepare(`
    INSERT INTO habits (name, description, schedule)
    VALUES (?, ?, ?)
  `).run(
    data.name,
    data.description,
    data.schedule
  );

  const habit = db.prepare(`
    SELECT *
    FROM habits
    WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(formatHabit(habit));
});

app.patch("/api/habits/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Invalid habit ID."
    });
  }

  const data = validateHabit(req.body);

  if (data.error) {
    return res.status(400).json({
      error: data.error
    });
  }

  const result = db.prepare(`
    UPDATE habits
    SET name = ?, description = ?, schedule = ?
    WHERE id = ?
  `).run(
    data.name,
    data.description,
    data.schedule,
    id
  );

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  const habit = db.prepare(`
    SELECT *
    FROM habits
    WHERE id = ?
  `).get(id);

  res.json(formatHabit(habit));
});

app.delete("/api/habits/:id", (req, res) => {
  const id = Number(req.params.id);

  const result = db.prepare(`
    UPDATE habits
    SET active = 0
    WHERE id = ?
  `).run(id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  res.status(204).send();
});

app.patch("/api/habits/:id/restore", (req, res) => {
  const id = Number(req.params.id);

  const result = db.prepare(`
    UPDATE habits
    SET active = 1
    WHERE id = ?
  `).run(id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  const habit = db.prepare(`
    SELECT *
    FROM habits
    WHERE id = ?
  `).get(id);

  res.json(formatHabit(habit));
});

app.get("/api/habits/:id/completions", (req, res) => {
  const id = Number(req.params.id);

  const habit = db.prepare(`
    SELECT *
    FROM habits
    WHERE id = ?
  `).get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  const rows = db.prepare(`
    SELECT completion_date
    FROM completions
    WHERE habit_id = ?
    ORDER BY completion_date DESC
  `).all(id);

  res.json(rows.map(row => row.completion_date));
});

app.post("/api/habits/:id/completions", (req, res) => {
  const id = Number(req.params.id);
  const date = req.body.date || formatDate(new Date());

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Invalid habit ID."
    });
  }

  if (!isValidDate(date)) {
    return res.status(400).json({
      error: "Date must use YYYY-MM-DD format."
    });
  }

  const habit = db.prepare(`
    SELECT *
    FROM habits
    WHERE id = ?
  `).get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  if (!isRequiredDay(habit, parseDate(date))) {
    return res.status(400).json({
      error: "This habit is not scheduled for this day."
    });
  }

  db.prepare(`
    INSERT OR IGNORE INTO completions
      (habit_id, completion_date)
    VALUES (?, ?)
  `).run(id, date);

  const updated = db.prepare(`
    SELECT *
    FROM habits
    WHERE id = ?
  `).get(id);

  res.status(201).json(formatHabit(updated));
});

app.delete("/api/habits/:id/completions/:date", (req, res) => {
  const id = Number(req.params.id);
  const date = req.params.date;

  if (!isValidDate(date)) {
    return res.status(400).json({
      error: "Invalid date."
    });
  }

  db.prepare(`
    DELETE FROM completions
    WHERE habit_id = ?
      AND completion_date = ?
  `).run(id, date);

  res.status(204).send();
});

app.get("/api/habits/:id/history", (req, res) => {
  const id = Number(req.params.id);
  const days = Math.min(
    Math.max(Number(req.query.days || 75), 1),
    365
  );

  const habit = db.prepare(`
    SELECT *
    FROM habits
    WHERE id = ?
  `).get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found."
    });
  }

  const today = new Date();
  const start = new Date(today);

  start.setDate(today.getDate() - days + 1);

  const rows = db.prepare(`
    SELECT completion_date
    FROM completions
    WHERE habit_id = ?
      AND completion_date >= ?
    ORDER BY completion_date
  `).all(id, formatDate(start));

  const completed = new Set(
    rows.map(row => row.completion_date)
  );

  const history = [];

  for (
    let i = 0;
    i < days;
    i++
  ) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    history.push({
      date: formatDate(date),
      required: isRequiredDay(habit, date),
      completed: completed.has(formatDate(date))
    });
  }

  res.json(history);
});

app.get("/api/dashboard", (req, res) => {
  const today = formatDate(new Date());

  const habits = db.prepare(`
    SELECT *
    FROM habits
    WHERE active = 1
  `).all();

  let dueToday = 0;
  let completedToday = 0;

  for (const habit of habits) {
    if (!isRequiredDay(habit, new Date())) {
      continue;
    }

    dueToday++;

    const completion = db.prepare(`
      SELECT id
      FROM completions
      WHERE habit_id = ?
        AND completion_date = ?
    `).get(habit.id, today);

    if (completion) {
      completedToday++;
    }
  }

  const totalCompletions = db.prepare(`
    SELECT COUNT(*) AS count
    FROM completions
  `).get().count;

  res.json({
    today,
    activeHabits: habits.length,
    dueToday,
    completedToday,
    completionRate:
      dueToday === 0
        ? 0
        : Math.round((completedToday / dueToday) * 100),
    totalCompletions
  });
});

app.listen(PORT, () => {
  console.log(`Habit Tracker API running on port ${PORT}`);
});
EOF

# --------------------------------------------------
# CLIENT PACKAGE
# --------------------------------------------------

cat > client/package.json <<'EOF'
{
  "name": "habit-tracker-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.5"
  }
}
EOF

# --------------------------------------------------
# VITE CONFIG
# --------------------------------------------------

cat > client/vite.config.js <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
EOF

# --------------------------------------------------
# HTML
# --------------------------------------------------

cat > client/index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="A simple 75-day habit tracker for building consistent routines." />
    <title>HabitFlow — 75 Day Habit Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# --------------------------------------------------
# API CLIENT
# --------------------------------------------------

cat > client/src/api.js <<'EOF'
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getHabits: (search = "") =>
    request(`/habits?search=${encodeURIComponent(search)}`),

  getArchivedHabits: () =>
    request("/habits?archived=true"),

  createHabit: (data) =>
    request("/habits", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  updateHabit: (id, data) =>
    request(`/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),

  archiveHabit: (id) =>
    request(`/habits/${id}`, {
      method: "DELETE"
    }),

  restoreHabit: (id) =>
    request(`/habits/${id}/restore`, {
      method: "PATCH"
    }),

  getCompletions: (id) =>
    request(`/habits/${id}/completions`),

  completeHabit: (id, date) =>
    request(`/habits/${id}/completions`, {
      method: "POST",
      body: JSON.stringify({ date })
    }),

  undoHabit: (id, date) =>
    request(`/habits/${id}/completions/${date}`, {
      method: "DELETE"
    }),

  getHistory: (id, days = 75) =>
    request(`/habits/${id}/history?days=${days}`),

  getDashboard: () =>
    request("/dashboard")
};
EOF

# --------------------------------------------------
# MAIN
# --------------------------------------------------

cat > client/src/main.jsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# --------------------------------------------------
# APP
# --------------------------------------------------

cat > client/src/App.jsx <<'EOF'
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  Check,
  Flame,
  History,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trophy,
  X
} from "lucide-react";
import { api } from "./api";

function todayString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayDate() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
}

function HabitModal({ habit, onClose, onSave }) {
  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(
    habit?.description || ""
  );
  const [schedule, setSchedule] = useState(
    habit?.schedule || "daily"
  );
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setSaving(true);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        schedule
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{habit ? "Edit habit" : "Create habit"}</h2>
            <p>Keep it simple and make it sustainable.</p>
          </div>

          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit}>
          <label>
            Habit name
            <input
              autoFocus
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Read for 20 minutes"
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              maxLength={200}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="What does success look like?"
              rows="3"
            />
          </label>

          <label>
            Schedule
            <select
              value={schedule}
              onChange={(event) =>
                setSchedule(event.target.value)
              }
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays only</option>
            </select>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              disabled={saving || !name.trim()}
            >
              {saving
                ? "Saving..."
                : habit
                  ? "Save changes"
                  : "Create habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryModal({ habit, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHistory(habit.id, 75)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [habit.id]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal history-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{habit.name} history</h2>
            <p>Last 75 days</p>
          </div>

          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="loading-box">Loading history...</div>
        ) : (
          <div className="history-grid">
            {history.map((item) => (
              <div
                key={item.date}
                className={`history-day ${
                  !item.required
                    ? "not-required"
                    : item.completed
                      ? "completed"
                      : "missed"
                }`}
                title={`${item.date}${
                  item.completed
                    ? " — completed"
                    : item.required
                      ? " — not completed"
                      : " — not scheduled"
                }`}
              >
                <span>{new Date(
                  `${item.date}T00:00:00`
                ).getDate()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="history-legend">
          <span><i className="legend completed" /> Completed</span>
          <span><i className="legend missed" /> Missed</span>
          <span><i className="legend not-required" /> Not scheduled</span>
        </div>
      </div>
    </div>
  );
}

function HabitCard({
  habit,
  completed,
  onToggle,
  onEdit,
  onArchive,
  onHistory
}) {
  return (
    <article className={`habit-card ${completed ? "is-complete" : ""}`}>
      <button
        className={`check-button ${completed ? "checked" : ""}`}
        onClick={() => onToggle(habit)}
        aria-label={
          completed
            ? `Undo ${habit.name}`
            : `Complete ${habit.name}`
        }
      >
        {completed && <Check size={21} strokeWidth={3} />}
      </button>

      <div className="habit-content">
        <div className="habit-title-row">
          <div>
            <h3>{habit.name}</h3>
            {habit.description && (
              <p>{habit.description}</p>
            )}
          </div>

          <span className="schedule-pill">
            {habit.schedule === "weekdays"
              ? "Weekdays"
              : "Daily"}
          </span>
        </div>

        <div className="habit-metrics">
          <span>
            <Flame size={16} />
            {habit.currentStreak} day streak
          </span>

          <span>
            <Trophy size={16} />
            Best {habit.bestStreak}
          </span>
        </div>
      </div>

      <div className="habit-actions">
        <button
          className="icon-button"
          title="View 75-day history"
          onClick={() => onHistory(habit)}
        >
          <History size={17} />
        </button>

        <button
          className="icon-button"
          title="Edit habit"
          onClick={() => onEdit(habit)}
        >
          <Pencil size={17} />
        </button>

        <button
          className="icon-button danger"
          title="Archive habit"
          onClick={() => onArchive(habit)}
        >
          <Archive size={17} />
        </button>
      </div>
    </article>
  );
}

function App() {
  const [habits, setHabits] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [completedToday, setCompletedToday] = useState(new Set());
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function loadData(searchValue = search) {
    try {
      setError("");

      const [habitData, dashboardData] =
        await Promise.all([
          api.getHabits(searchValue),
          api.getDashboard()
        ]);

      setHabits(habitData);
      setDashboard(dashboardData);

      const completions = await Promise.all(
        habitData.map(async (habit) => {
          const dates = await api.getCompletions(habit.id);
          return [
            habit.id,
            dates.includes(todayString())
          ];
        })
      );

      setCompletedToday(
        new Set(
          completions
            .filter(([, completed]) => completed)
            .map(([id]) => id)
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  async function toggleHabit(habit) {
    try {
      setBusyId(habit.id);
      setError("");

      const completed = completedToday.has(habit.id);

      if (completed) {
        await api.undoHabit(
          habit.id,
          todayString()
        );
      } else {
        await api.completeHabit(
          habit.id,
          todayString()
        );
      }

      await loadData(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function saveHabit(data) {
    try {
      setError("");

      if (modal.type === "edit") {
        await api.updateHabit(
          modal.habit.id,
          data
        );
      } else {
        await api.createHabit(data);
      }

      setModal(null);
      await loadData(search);
    } catch (err) {
      setError(err.message);
    }
  }

  async function archiveHabit(habit) {
    const confirmed = window.confirm(
      `Archive "${habit.name}"? Its history will be preserved.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.archiveHabit(habit.id);
      await loadData(search);
    } catch (err) {
      setError(err.message);
    }
  }

  const completionRate = dashboard?.completionRate || 0;

  const challengeDay = useMemo(() => {
    const created = new Date();
    const dayOfYear = Math.floor(
      (created - new Date(created.getFullYear(), 0, 0)) /
      86400000
    );

    return Math.min(dayOfYear, 75);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Target size={21} />
          </div>
          <div>
            <strong>HabitFlow</strong>
            <span>75-day challenge</span>
          </div>
        </div>

        <button
          className="primary-button add-button"
          onClick={() =>
            setModal({ type: "create" })
          }
        >
          <Plus size={18} />
          Add habit
        </button>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">TODAY · {displayDate()}</p>
            <h1>Keep your streak alive.</h1>
            <p className="hero-copy">
              Focus on what matters today. Small wins,
              repeated consistently, become habits.
            </p>
          </div>

          <div className="challenge-card">
            <div className="challenge-top">
              <span>75-DAY CHALLENGE</span>
              <strong>Day {challengeDay} / 75</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(challengeDay / 75) * 100}%`
                }}
              />
            </div>
          </div>
        </section>

        {dashboard && (
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><CalendarDays /></div>
              <div>
                <span>Today's habits</span>
                <strong>{dashboard.dueToday}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><Check /></div>
              <div>
                <span>Completed today</span>
                <strong>
                  {dashboard.completedToday} / {dashboard.dueToday}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><Target /></div>
              <div>
                <span>Today's progress</span>
                <strong>{completionRate}%</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><Flame /></div>
              <div>
                <span>Total check-ins</span>
                <strong>{dashboard.totalCompletions}</strong>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <section className="section-heading">
          <div>
            <h2>Today's habits</h2>
            <p>Check them off one by one.</p>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search habits..."
            />

            {search && (
              <button onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </div>
        </section>

        {loading ? (
          <div className="loading-box">
            Loading your habits...
          </div>
        ) : habits.length === 0 ? (
          <div className="empty-state">
            <Target size={36} />
            <h3>
              {search
                ? "No habits found"
                : "No habits yet"}
            </h3>
            <p>
              {search
                ? "Try another search term."
                : "Create your first habit and start building your streak."}
            </p>

            {!search && (
              <button
                className="primary-button"
                onClick={() =>
                  setModal({ type: "create" })
                }
              >
                <Plus size={18} />
                Create your first habit
              </button>
            )}
          </div>
        ) : (
          <div className="habit-list">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={completedToday.has(habit.id)}
                onToggle={toggleHabit}
                onEdit={(item) =>
                  setModal({
                    type: "edit",
                    habit: item
                  })
                }
                onArchive={archiveHabit}
                onHistory={(item) =>
                  setModal({
                    type: "history",
                    habit: item
                  })
                }
              />
            ))}
          </div>
        )}

        <section className="insight">
          <Flame size={20} />
          <div>
            <strong>Consistency beats perfection.</strong>
            <p>
              Missed a day? Start again today. Your best
              streak is always waiting to be beaten.
            </p>
          </div>
        </section>
      </main>

      {busyId && (
        <div className="saving-indicator">
          Saving...
        </div>
      )}

      {modal?.type === "create" && (
        <HabitModal
          onClose={() => setModal(null)}
          onSave={saveHabit}
        />
      )}

      {modal?.type === "edit" && (
        <HabitModal
          habit={modal.habit}
          onClose={() => setModal(null)}
          onSave={saveHabit}
        />
      )}

      {modal?.type === "history" && (
        <HistoryModal
          habit={modal.habit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default App;
EOF

# --------------------------------------------------
# STYLES
# --------------------------------------------------

cat > client/src/styles.css <<'EOF'
* {
  box-sizing: border-box;
}

:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;

  color: #172033;
  background: #f5f7fb;
  font-synthesis: none;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, #eef2ff 0, transparent 35%),
    #f7f8fc;
}

.topbar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6%;
  background: rgba(255,255,255,.92);
  border-bottom: 1px solid #e7eaf0;
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(10px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #172033;
  color: white;
}

.brand strong,
.brand span {
  display: block;
}

.brand strong {
  font-size: 17px;
}

.brand span {
  font-size: 11px;
  color: #7b8496;
  margin-top: 2px;
}

.container {
  width: min(1120px, 88%);
  margin: 0 auto;
  padding: 42px 0 60px;
}

.hero {
  display: grid;
  grid-template-columns: 1.35fr .65fr;
  gap: 25px;
  align-items: end;
  margin-bottom: 28px;
}

.eyebrow {
  color: #68738a;
  font-size: 11px;
  letter-spacing: .12em;
  font-weight: 800;
  margin: 0 0 12px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 48px);
  letter-spacing: -.04em;
  line-height: 1.05;
}

.hero-copy {
  max-width: 580px;
  color: #68738a;
  line-height: 1.65;
  margin: 14px 0 0;
}

.challenge-card {
  background: #172033;
  color: white;
  padding: 20px;
  border-radius: 18px;
  box-shadow: 0 14px 35px rgba(23, 32, 51, .15);
}

.challenge-top {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.challenge-top span {
  font-size: 10px;
  letter-spacing: .1em;
  opacity: .65;
  font-weight: 800;
}

.challenge-top strong {
  font-size: 13px;
}

.progress-track {
  height: 7px;
  border-radius: 99px;
  background: rgba(255,255,255,.14);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: inherit;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 38px;
}

.stat-card {
  background: white;
  border: 1px solid #e7eaf0;
  border-radius: 15px;
  padding: 17px;
  display: flex;
  gap: 13px;
  align-items: center;
}

.stat-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: #f0f2f7;
  border-radius: 10px;
}

.stat-icon svg {
  width: 18px;
  height: 18px;
}

.stat-card span,
.stat-card strong {
  display: block;
}

.stat-card span {
  font-size: 11px;
  color: #7c8494;
}

.stat-card strong {
  margin-top: 4px;
  font-size: 20px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: end;
  margin-bottom: 17px;
}

.section-heading h2 {
  margin: 0;
  font-size: 22px;
}

.section-heading p {
  color: #7c8494;
  font-size: 13px;
  margin: 5px 0 0;
}

.search-box {
  width: 270px;
  height: 43px;
  display: flex;
  align-items: center;
  gap: 9px;
  background: white;
  border: 1px solid #dfe3eb;
  border-radius: 11px;
  padding: 0 12px;
}

.search-box svg {
  color: #8992a4;
  flex-shrink: 0;
}

.search-box input {
  border: 0;
  outline: 0;
  width: 100%;
  background: transparent;
  font-size: 13px;
}

.search-box button,
.error-banner button {
  border: 0;
  background: transparent;
  padding: 3px;
  color: #737c8d;
}

.habit-list {
  display: grid;
  gap: 12px;
}

.habit-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 17px;
  background: white;
  border: 1px solid #e5e8ef;
  border-radius: 15px;
  transition: .2s ease;
}

.habit-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(35, 44, 62, .07);
}

.habit-card.is-complete {
  border-color: #cfd5df;
  background: #fcfcfd;
}

.check-button {
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  border: 2px solid #d9dee7;
  background: white;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: white;
}

.check-button.checked {
  background: #172033;
  border-color: #172033;
}

.habit-content {
  flex: 1;
  min-width: 0;
}

.habit-title-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  align-items: start;
}

.habit-title-row h3 {
  margin: 0;
  font-size: 16px;
}

.habit-title-row p {
  color: #7b8495;
  font-size: 12px;
  margin: 4px 0 0;
}

.schedule-pill {
  flex-shrink: 0;
  background: #f0f2f6;
  color: #687287;
  border-radius: 99px;
  padding: 5px 9px;
  font-size: 10px;
  font-weight: 700;
}

.habit-metrics {
  display: flex;
  gap: 18px;
  margin-top: 11px;
}

.habit-metrics span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #6e788c;
  font-size: 11px;
}

.habit-metrics svg {
  width: 15px;
  height: 15px;
}

.habit-actions {
  display: flex;
  gap: 2px;
}

.icon-button {
  border: 0;
  background: transparent;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #747e91;
}

.icon-button:hover {
  background: #f0f2f6;
}

.icon-button.danger:hover {
  color: #b42318;
  background: #fff1f0;
}

.primary-button,
.secondary-button {
  border: 0;
  border-radius: 10px;
  padding: 10px 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-weight: 700;
  font-size: 12px;
}

.primary-button {
  background: #172033;
  color: white;
}

.primary-button:hover {
  background: #252f46;
}

.primary-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.secondary-button {
  background: #eef0f4;
  color: #4f596d;
}

.add-button {
  padding: 10px 14px;
}

.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff1f0;
  color: #a22a20;
  border: 1px solid #ffd4d0;
  padding: 11px 14px;
  border-radius: 10px;
  margin-bottom: 18px;
  font-size: 13px;
}

.loading-box,
.empty-state {
  background: white;
  border: 1px solid #e5e8ef;
  border-radius: 15px;
  min-height: 170px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 35px;
  color: #7b8495;
}

.empty-state {
  gap: 8px;
}

.empty-state svg {
  color: #8992a4;
}

.empty-state h3 {
  margin: 3px 0 0;
  color: #263147;
}

.empty-state p {
  margin: 0 0 10px;
  font-size: 13px;
}

.insight {
  margin-top: 24px;
  padding: 17px;
  display: flex;
  gap: 12px;
  border: 1px dashed #d6dae2;
  border-radius: 13px;
  color: #697387;
}

.insight svg {
  flex-shrink: 0;
}

.insight strong {
  color: #313b50;
  font-size: 13px;
}

.insight p {
  margin: 4px 0 0;
  font-size: 12px;
}

.saving-indicator {
  position: fixed;
  right: 22px;
  bottom: 22px;
  padding: 10px 14px;
  background: #172033;
  color: white;
  border-radius: 9px;
  font-size: 11px;
  box-shadow: 0 8px 25px rgba(0,0,0,.18);
  z-index: 50;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 30, .52);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 100;
}

.modal {
  width: min(480px, 100%);
  background: white;
  border-radius: 18px;
  padding: 23px;
  box-shadow: 0 25px 70px rgba(0,0,0,.25);
}

.history-modal {
  width: min(650px, 100%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 22px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-header p {
  margin: 5px 0 0;
  color: #7b8495;
  font-size: 12px;
}

.modal form {
  display: grid;
  gap: 16px;
}

.modal label {
  display: grid;
  gap: 7px;
  color: #424c61;
  font-size: 12px;
  font-weight: 700;
}

.modal input,
.modal textarea,
.modal select {
  width: 100%;
  border: 1px solid #dce0e8;
  border-radius: 9px;
  outline: none;
  padding: 11px;
  color: #1e283c;
  background: white;
}

.modal input:focus,
.modal textarea:focus,
.modal select:focus {
  border-color: #778195;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 5px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 7px;
}

.history-day {
  aspect-ratio: 1;
  border-radius: 7px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  background: #f0f1f4;
  color: #747d8d;
}

.history-day.completed {
  background: #172033;
  color: white;
}

.history-day.missed {
  background: #f4d6d3;
  color: #9b342c;
}

.history-day.not-required {
  background: #fafafa;
  color: #c2c6ce;
}

.history-legend {
  display: flex;
  gap: 15px;
  margin-top: 18px;
  flex-wrap: wrap;
  font-size: 10px;
  color: #6f788a;
}

.history-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend {
  width: 9px;
  height: 9px;
  border-radius: 3px;
  background: #ddd;
}

.legend.completed {
  background: #172033;
}

.legend.missed {
  background: #f4d6d3;
}

.legend.not-required {
  background: #fafafa;
  border: 1px solid #ddd;
}

@media (max-width: 800px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }
}

@media (max-width: 580px) {
  .topbar {
    padding: 0 5%;
  }

  .container {
    width: 90%;
    padding-top: 28px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card {
    padding: 12px;
  }

  .habit-card {
    align-items: flex-start;
  }

  .habit-actions {
    flex-direction: column;
  }

  .schedule-pill {
    display: none;
  }

  .history-grid {
    grid-template-columns: repeat(10, 1fr);
  }

  .brand span {
    display: none;
  }

  .add-button {
    font-size: 0;
    width: 38px;
    height: 38px;
    padding: 0;
  }

  .add-button svg {
    width: 19px;
  }
}
EOF

# --------------------------------------------------
# INSTALL
# --------------------------------------------------

echo "Installing dependencies..."

npm install
npm --prefix client install
npm --prefix server install

# --------------------------------------------------
# BUILD TEST
# --------------------------------------------------

echo "Building frontend..."

npm run build

# --------------------------------------------------
# API TEST
# --------------------------------------------------

echo "Starting backend for API test..."

npm --prefix server start > /tmp/habit-server.log 2>&1 &
SERVER_PID=$!

sleep 3

echo "Testing health endpoint..."

curl -fsS http://localhost:4000/api/health

echo ""
echo "Testing habits endpoint..."

curl -fsS http://localhost:4000/api/habits > /tmp/habits.json

cat /tmp/habits.json

kill $SERVER_PID 2>/dev/null || true

# --------------------------------------------------
# GIT
# --------------------------------------------------

echo ""
echo "======================================"
echo " Running Git checks"
echo "======================================"

git status

git add .

git commit -m "feat: build habit tracker core platform"

git push origin main

echo ""
echo "======================================"
echo " BUILD COMPLETE"
echo "======================================"

git status

SCRIPT

bash /tmp/build-habit-tracker.sh
