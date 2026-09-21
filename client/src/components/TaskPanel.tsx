import { useState } from "react";
import { useRoom } from "../context/RoomContext";

export default function TaskPanel() {
  const { state, canControlRound, addTask, removeTask, setCurrentTask } = useRoom();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (!state) return null;

  function submitAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed, description.trim());
    setTitle("");
    setDescription("");
    setAdding(false);
  }

  if (!canControlRound && state.tasks.length === 0) return null;

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Tasks</h3>
        {canControlRound && !adding && (
          <button className="subtle" onClick={() => setAdding(true)}>
            + Add task
          </button>
        )}
      </div>

      {adding && (
        <div className="stack">
          <input type="text" placeholder="Task title, e.g. PROJ-123 Add search filter" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} />
          <div className="row">
            <button className="primary" onClick={submitAdd} disabled={!title.trim()}>
              Add
            </button>
            <button
              className="subtle"
              onClick={() => {
                setAdding(false);
                setTitle("");
                setDescription("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.tasks.length === 0 && !adding && <p className="muted">No tasks added yet.</p>}

      {state.tasks.length > 0 && (
        <ul className="task-list">
          {state.tasks.map((task, i) => {
            const result = state.taskResults[task.id];
            const isCurrent = task.id === state.currentTaskId;
            return (
              <li key={task.id} className={`task-row${isCurrent ? " current" : ""}`}>
                <div className="row">
                  <button
                    className="task-row-main subtle"
                    disabled={!canControlRound || isCurrent}
                    onClick={() => setCurrentTask(task.id)}
                    title={canControlRound ? "Switch to this task" : undefined}
                  >
                    <span className="muted">{i + 1}.</span> {task.title}
                    {result && <span className="badge">avg {result.average?.toFixed(1) ?? "—"}</span>}
                  </button>
                  {canControlRound && (
                    <button className="subtle" onClick={() => removeTask(task.id)} aria-label={`Remove ${task.title}`}>
                      ✕
                    </button>
                  )}
                </div>
                {isCurrent && task.description && (
                  <p className="muted task-description">{task.description}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
