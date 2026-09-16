import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function parseDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function previousDate(date) {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return formatDate(d);
}

function isRequiredDay(schedule, date) {
  const day = parseDate(date).getUTCDay();

  if (schedule === "daily") {
    return true;
  }

  return day !== 0 && day !== 6;
}

function getCompletions(habitId) {
  return new Set(
    db
      .prepare(
        "SELECT completion_date FROM completions WHERE habit_id = ?"
      )
      .all(habitId)
      .map(row => row.completion_date)
  );
}

function calculateCurrentStreak(habit) {
  const completions = getCompletions(habit.id);

  let date = today();

  // If today is a required day but hasn't been completed,
  // start from the previous required day.
  if (
    isRequiredDay(habit.schedule, date) &&
    !completions.has(date)
  ) {
    date = previousDate(date);
  }

  let streak = 0;

  while (true) {
    if (!isRequiredDay(habit.schedule, date)) {
      date = previousDate(date);
      continue;
    }

    if (!completions.has(date)) {
      break;
    }

    streak++;
    date = previousDate(date);
  }

  return streak;
}

function calculateBestStreak(habit) {
  const completions = getCompletions(habit.id);

  let date = habit.created_at.slice(0, 10);
  const end = today();

  let current = 0;
  let best = 0;

  while (date <= end) {
    if (!isRequiredDay(habit.schedule, date)) {
      date = formatDate(
        new Date(parseDate(date).getTime() + 86400000)
      );
      continue;
    }

    if (completions.has(date)) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }

    date = formatDate(
      new Date(parseDate(date).getTime() + 86400000)
    );
  }

  return best;
}

function habitWithStats(habit) {
  return {
    ...habit,
    active: Boolean(habit.active),
    currentStreak: calculateCurrentStreak(habit),
    bestStreak: calculateBestStreak(habit)
  };
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "HabitFlow API is running"
  });
});

// Get habits
app.get("/api/habits", (req, res) => {
  const search = String(req.query.search || "").trim();
  const archived = req.query.archived === "true";

  let query = `
    SELECT *
    FROM habits
    WHERE active = ?
  `;

  const params = [archived ? 0 : 1];

  if (search) {
    query += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY created_at DESC";

  const habits = db.prepare(query).all(...params);

  res.json(habits.map(habitWithStats));
});

// Create habit
app.post("/api/habits", (req, res) => {
  const { name, description = "", schedule = "daily" } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({
      error: "Habit name is required"
    });
  }

  if (!["daily", "weekdays"].includes(schedule)) {
    return res.status(400).json({
      error: "Schedule must be daily or weekdays"
    });
  }

  const result = db
    .prepare(`
      INSERT INTO habits (name, description, schedule)
      VALUES (?, ?, ?)
    `)
    .run(String(name).trim(), String(description), schedule);

  const habit = db
    .prepare("SELECT * FROM habits WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(habitWithStats(habit));
});

// Update habit
app.patch("/api/habits/:id", (req, res) => {
  const id = Number(req.params.id);
  const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found"
    });
  }

  const name =
    req.body.name !== undefined
      ? String(req.body.name).trim()
      : habit.name;

  const description =
    req.body.description !== undefined
      ? String(req.body.description)
      : habit.description;

  const schedule =
    req.body.schedule !== undefined
      ? req.body.schedule
      : habit.schedule;

  if (!name) {
    return res.status(400).json({
      error: "Habit name is required"
    });
  }

  if (!["daily", "weekdays"].includes(schedule)) {
    return res.status(400).json({
      error: "Schedule must be daily or weekdays"
    });
  }

  db.prepare(`
    UPDATE habits
    SET name = ?, description = ?, schedule = ?
    WHERE id = ?
  `).run(name, description, schedule, id);

  const updated = db
    .prepare("SELECT * FROM habits WHERE id = ?")
    .get(id);

  res.json(habitWithStats(updated));
});

// Archive habit
app.delete("/api/habits/:id", (req, res) => {
  const id = Number(req.params.id);

  const result = db
    .prepare("UPDATE habits SET active = 0 WHERE id = ?")
    .run(id);

  if (!result.changes) {
    return res.status(404).json({
      error: "Habit not found"
    });
  }

  res.json({
    message: "Habit archived successfully"
  });
});

// Restore habit
app.patch("/api/habits/:id/restore", (req, res) => {
  const id = Number(req.params.id);

  const result = db
    .prepare("UPDATE habits SET active = 1 WHERE id = ?")
    .run(id);

  if (!result.changes) {
    return res.status(404).json({
      error: "Habit not found"
    });
  }

  const habit = db
    .prepare("SELECT * FROM habits WHERE id = ?")
    .get(id);

  res.json(habitWithStats(habit));
});

// Get completions
app.get("/api/habits/:id/completions", (req, res) => {
  const id = Number(req.params.id);

  const habit = db
    .prepare("SELECT * FROM habits WHERE id = ?")
    .get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found"
    });
  }

  const completions = db
    .prepare(`
      SELECT completion_date
      FROM completions
      WHERE habit_id = ?
      ORDER BY completion_date DESC
    `)
    .all(id);

  res.json(completions.map(row => row.completion_date));
});

// Complete habit
app.post("/api/habits/:id/completions", (req, res) => {
  const id = Number(req.params.id);
  const completionDate = req.body.date || today();

  if (!isValidDate(completionDate)) {
    return res.status(400).json({
      error: "Invalid date. Use YYYY-MM-DD."
    });
  }

  const habit = db
    .prepare("SELECT * FROM habits WHERE id = ?")
    .get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found"
    });
  }

  if (completionDate > today()) {
    return res.status(400).json({
      error: "Future completion is not allowed"
    });
  }

  if (!isRequiredDay(habit.schedule, completionDate)) {
    return res.status(400).json({
      error: "This habit is not scheduled for this day"
    });
  }

  db.prepare(`
    INSERT OR IGNORE INTO completions
    (habit_id, completion_date)
    VALUES (?, ?)
  `).run(id, completionDate);

  res.json(habitWithStats(habit));
});

// Undo completion
app.delete("/api/habits/:id/completions/:date", (req, res) => {
  const id = Number(req.params.id);
  const completionDate = req.params.date;

  if (!isValidDate(completionDate)) {
    return res.status(400).json({
      error: "Invalid date. Use YYYY-MM-DD."
    });
  }

  db.prepare(`
    DELETE FROM completions
    WHERE habit_id = ? AND completion_date = ?
  `).run(id, completionDate);

  res.json({
    message: "Completion removed"
  });
});

// 75-day history
app.get("/api/habits/:id/history", (req, res) => {
  const id = Number(req.params.id);
  const days = Math.min(
    Math.max(Number(req.query.days) || 75, 1),
    365
  );

  const habit = db
    .prepare("SELECT * FROM habits WHERE id = ?")
    .get(id);

  if (!habit) {
    return res.status(404).json({
      error: "Habit not found"
    });
  }

  const completions = getCompletions(id);
  const result = [];

  let date = today();

  for (let i = 0; i < days; i++) {
    result.push({
      date,
      required: isRequiredDay(habit.schedule, date),
      completed: completions.has(date)
    });

    date = previousDate(date);
  }

  res.json(result.reverse());
});

// Dashboard
app.get("/api/dashboard", (req, res) => {
  const habits = db
    .prepare(`
      SELECT *
      FROM habits
      WHERE active = 1
      ORDER BY created_at ASC
    `)
    .all();

  const date = today();

  const dashboardHabits = habits.map(habit => {
    const completion = db
      .prepare(`
        SELECT id
        FROM completions
        WHERE habit_id = ? AND completion_date = ?
      `)
      .get(habit.id, date);

    return {
      ...habitWithStats(habit),
      completedToday: Boolean(completion),
      requiredToday: isRequiredDay(habit.schedule, date)
    };
  });

  const requiredToday = dashboardHabits.filter(
    habit => habit.requiredToday
  );

  const completedToday = requiredToday.filter(
    habit => habit.completedToday
  );

  res.json({
    date,
    totalHabits: dashboardHabits.length,
    requiredToday: requiredToday.length,
    completedToday: completedToday.length,
    completionRate:
      requiredToday.length === 0
        ? 0
        : Math.round(
            (completedToday.length / requiredToday.length) * 100
          ),
    habits: dashboardHabits
  });
});

app.listen(PORT, () => {
  console.log(`HabitFlow API running on port ${PORT}`);
});
