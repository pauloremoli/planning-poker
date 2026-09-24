import { useState } from "react";
import type { TaskInfo } from "@planning-poker/shared";
import { useRoom } from "../context/RoomContext";
import Linkify from "./Linkify";

export default function TaskPanel() {
  const { state, canControlRound, addTask, editTask, removeTask, moveTask, setCurrentTask } = useRoom();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  if (!state) return null;

  function submitAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed, description.trim());
    setTitle("");
    setDescription("");
    setAdding(false);
  }

  function startEdit(task: TaskInfo) {
    setAdding(false);
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  }

  function submitEdit() {
    const trimmed = editTitle.trim();
    if (!trimmed || !editingId) return;
    editTask(editingId, trimmed, editDescription.trim());
    cancelEdit();
  }

  if (!canControlRound) {
    // Regular members only need to know what's being voted on right now —
    // the full task list (and reordering/removal) is host/admin business.
    const currentTask = state.tasks.find((t) => t.id === state.currentTaskId);
    if (!currentTask) return null;
    const result = state.taskResults[currentTask.id];
    return (
      <div className="card stack">
        <span className="muted">Voting for task:</span>
        <div className="row between">
          <h3>{currentTask.title}</h3>
          {result && <span className="badge">avg {result.average?.toFixed(1) ?? "—"}</span>}
        </div>
        {currentTask.description && (
          <p className="muted task-description">
            <Linkify text={currentTask.description} />
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Tasks</h3>
        {!adding && (
          <button
            className="subtle"
            onClick={() => {
              cancelEdit();
              setAdding(true);
            }}
          >
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
            const isEditing = editingId === task.id;
            return (
              <li key={task.id} className={`task-row${isCurrent ? " current" : ""}`}>
                {isEditing ? (
                  <div className="stack">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={120} autoFocus />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={2000} rows={3} />
                    <div className="row">
                      <button className="primary" onClick={submitEdit} disabled={!editTitle.trim()}>
                        Save
                      </button>
                      <button className="subtle" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="row">
                      <button className="task-row-main subtle" disabled={isCurrent} onClick={() => setCurrentTask(task.id)} title="Switch to this task">
                        <span className="muted">{i + 1}.</span> {task.title}
                        {result && <span className="badge">avg {result.average?.toFixed(1) ?? "—"}</span>}
                      </button>
                      <button className="subtle" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`}>
                        ✎
                      </button>
                      <button className="subtle" disabled={i === 0} onClick={() => moveTask(task.id, "up")} aria-label={`Move ${task.title} up`}>
                        ▲
                      </button>
                      <button
                        className="subtle"
                        disabled={i === state.tasks.length - 1}
                        onClick={() => moveTask(task.id, "down")}
                        aria-label={`Move ${task.title} down`}
                      >
                        ▼
                      </button>
                      <button className="subtle" onClick={() => removeTask(task.id)} aria-label={`Remove ${task.title}`}>
                        ✕
                      </button>
                    </div>
                    {isCurrent && task.description && (
                      <p className="muted task-description">
                        <Linkify text={task.description} />
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
