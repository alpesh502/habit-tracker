import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMorningReminder, setShowMorningReminder] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    schedule: "daily"
  });

  const loadDashboard = async () => {
    try {
      setError("");

      const data = await api.getDashboard();

      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /*
   * Morning reminder:
   * The reminder is shown during the morning when there
   * are scheduled habits that have not been completed today.
   */
  const isMorning = new Date().getHours() < 12;

  const incompleteTodayHabits = useMemo(() => {
    if (!dashboard) return [];

    return dashboard.habits.filter(
      (habit) =>
        habit.requiredToday &&
        !habit.completedToday
    );
  }, [dashboard]);

  /*
   * Browser notification.
   *
   * A normal web application cannot reliably wake itself
   * when the browser is completely closed. Therefore the
   * notification is triggered when the application is open
   * during the morning.
   */
  useEffect(() => {
    if (
      !dashboard ||
      !isMorning ||
      incompleteTodayHabits.length === 0
    ) {
      return;
    }

    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("HabitFlow — Morning Reminder", {
        body: `You still have ${
          incompleteTodayHabits.length
        } habit${
          incompleteTodayHabits.length === 1 ? "" : "s"
        } to complete today.`
      });
    }
  }, [
    dashboard,
    isMorning,
    incompleteTodayHabits.length
  ]);

  const filteredHabits = useMemo(() => {
    if (!dashboard) return [];

    const term = search.toLowerCase().trim();

    if (!term) return dashboard.habits;

    return dashboard.habits.filter(
      (habit) =>
        habit.name.toLowerCase().includes(term) ||
        habit.description.toLowerCase().includes(term)
    );
  }, [dashboard, search]);

  const openAddForm = () => {
    setEditingHabit(null);

    setForm({
      name: "",
      description: "",
      schedule: "daily"
    });

    setShowForm(true);
  };

  const openEditForm = (habit) => {
    setEditingHabit(habit);

    setForm({
      name: habit.name,
      description: habit.description || "",
      schedule: habit.schedule
    });

    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) return;

    try {
      if (editingHabit) {
        await api.updateHabit(
          editingHabit.id,
          form
        );
      } else {
        await api.createHabit(form);
      }

      setShowForm(false);
      setEditingHabit(null);

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCompletion = async (habit) => {
    try {
      if (habit.completedToday) {
        await api.undoCompletion(
          habit.id,
          dashboard.date
        );
      } else {
        await api.completeHabit(
          habit.id,
          dashboard.date
        );
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const archiveHabit = async (habit) => {
    const confirmed = window.confirm(
      `Archive "${habit.name}"? Its history will be preserved.`
    );

    if (!confirmed) return;

    try {
      await api.archiveHabit(habit.id);

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="loading-logo">HF</div>

          <h2>
            Loading HabitFlow...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">

      {/* HEADER */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-mark">
            HF
          </div>

          <div>
            <h1>HabitFlow</h1>

            <span>
              75-Day Challenge
            </span>
          </div>

        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Habit
        </button>

      </header>


      <main className="main-content">

        {/* ERROR */}

        {error && (
          <div className="error-banner">

            <span>
              {error}
            </span>

            <button
              onClick={() => setError("")}
            >
              ×
            </button>

          </div>
        )}


        {/* MORNING REMINDER */}

        {isMorning &&
          showMorningReminder &&
          incompleteTodayHabits.length > 0 && (

            <section className="morning-reminder">

              <div className="reminder-icon">
                ☀
              </div>

              <div className="reminder-content">

                <div className="reminder-title-row">

                  <div>
                    <span className="eyebrow">
                      MORNING REMINDER
                    </span>

                    <h3>
                      Good morning!
                    </h3>
                  </div>

                  <button
                    className="reminder-close"
                    onClick={() =>
                      setShowMorningReminder(false)
                    }
                    aria-label="Close reminder"
                  >
                    ×
                  </button>

                </div>

                <p>
                  You still have{" "}
                  <strong>
                    {incompleteTodayHabits.length}
                  </strong>{" "}
                  habit
                  {incompleteTodayHabits.length === 1
                    ? ""
                    : "s"}{" "}
                  to complete today.
                </p>


                <div className="reminder-habits">

                  {incompleteTodayHabits.map(
                    (habit) => (

                      <button
                        key={habit.id}
                        className="reminder-habit"
                        onClick={() =>
                          toggleCompletion(habit)
                        }
                      >

                        <span className="reminder-check">
                          ○
                        </span>

                        <span>
                          {habit.name}
                        </span>

                        <span className="reminder-complete">
                          Complete
                        </span>

                      </button>

                    )
                  )}

                </div>

              </div>

            </section>

          )}


        {/* HERO */}

        <section className="hero">

          <div>

            <p className="eyebrow">
              TODAY • {dashboard.date}
            </p>

            <h2>
              Build consistency,
              one day at a time.
            </h2>

            <p className="hero-text">
              Complete your scheduled habits today
              and keep your streak alive.
            </p>

          </div>


          <div className="challenge-ring">

            <strong>
              {dashboard.completionRate}%
            </strong>

            <span>
              today
            </span>

          </div>

        </section>


        {/* STATS */}

        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-label">
              Today's Progress
            </span>

            <strong>
              {dashboard.completedToday}/
              {dashboard.requiredToday}
            </strong>

            <small>
              habits completed
            </small>

          </div>


          <div className="stat-card">

            <span className="stat-label">
              Completion Rate
            </span>

            <strong>
              {dashboard.completionRate}%
            </strong>

            <small>
              scheduled for today
            </small>

          </div>


          <div className="stat-card">

            <span className="stat-label">
              Active Habits
            </span>

            <strong>
              {dashboard.totalHabits}
            </strong>

            <small>
              currently tracking
            </small>

          </div>

        </section>


        {/* HABITS */}

        <section className="habits-section">

          <div className="section-heading">

            <div>

              <h3>
                Today's Habits
              </h3>

              <p>
                Stay focused on what matters today.
              </p>

            </div>


            <div className="search-box">

              <span>
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search habits..."
              />

            </div>

          </div>


          {filteredHabits.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ✓
              </div>

              <h3>
                No habits found
              </h3>

              <p>
                {search
                  ? "Try a different search."
                  : "Create your first habit to start your challenge."}
              </p>

              {!search && (

                <button
                  className="primary-button"
                  onClick={openAddForm}
                >
                  Create Habit
                </button>

              )}

            </div>

          ) : (

            <div className="habit-list">

              {filteredHabits.map(
                (habit) => (

                  <article
                    className="habit-card"
                    key={habit.id}
                  >

                    <button
                      className={`complete-button ${
                        habit.completedToday
                          ? "completed"
                          : ""
                      }`}
                      onClick={() =>
                        toggleCompletion(habit)
                      }
                      title={
                        habit.completedToday
                          ? "Undo completion"
                          : "Mark as complete"
                      }
                    >
                      {habit.completedToday
                        ? "✓"
                        : ""}
                    </button>


                    <div className="habit-main">

                      <div className="habit-title-row">

                        <h4>
                          {habit.name}
                        </h4>

                        <span className="schedule-badge">

                          {habit.schedule === "daily"
                            ? "Every day"
                            : "Weekdays"}

                        </span>

                      </div>


                      {habit.description && (

                        <p className="habit-description">
                          {habit.description}
                        </p>

                      )}


                      <div className="habit-stats">

                        <span>
                          🔥{" "}
                          <b>
                            {habit.currentStreak}
                          </b>{" "}
                          current streak
                        </span>

                        <span>
                          🏆{" "}
                          <b>
                            {habit.bestStreak}
                          </b>{" "}
                          best streak
                        </span>

                      </div>

                    </div>


                    <div className="habit-actions">

                      <button
                        onClick={() =>
                          openEditForm(habit)
                        }
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          archiveHabit(habit)
                        }
                      >
                        Archive
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </main>


      {/* FOOTER */}

      <footer className="footer">

        <span>
          HabitFlow
        </span>

        <span>
          75-Day Challenge •
          Consistency over perfection
        </span>

      </footer>


      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowForm(false)
          }
        >

          <div
            className="modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="eyebrow">

                  {editingHabit
                    ? "UPDATE HABIT"
                    : "NEW HABIT"}

                </span>

                <h3>

                  {editingHabit
                    ? "Edit your habit"
                    : "Create a habit"}

                </h3>

              </div>


              <button
                className="close-button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>


            <form onSubmit={handleSubmit}>

              <label>

                Habit name

                <input
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value
                    })
                  }
                  placeholder="e.g. Read 20 pages"
                />

              </label>


              <label>

                Description

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value
                    })
                  }
                  placeholder="What does success look like?"
                  rows="3"
                />

              </label>


              <label>

                Schedule

                <select
                  value={form.schedule}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      schedule: event.target.value
                    })
                  }
                >

                  <option value="daily">
                    Every day
                  </option>

                  <option value="weekdays">
                    Weekdays only
                  </option>

                </select>

              </label>


              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                >

                  {editingHabit
                    ? "Save Changes"
                    : "Create Habit"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;