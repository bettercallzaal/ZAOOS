'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  title: string;
  owner?: string;
  due?: string;
  legacy_source?: string;
  project?: string;
  status?: string;
  legacy_owner?: string;
}

interface TasksData {
  configured: boolean;
  message?: string;
  tasks?: Task[];
}

export default function OverviewPage() {
  const [tasksData, setTasksData] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLanes, setExpandedLanes] = useState<Record<string, boolean>>({
    waiting: true,
    loops: false,
    unsorted: false,
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks/list');
      const data: TasksData = await res.json();
      setTasksData(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setSubmitting(true);
    try {
      setNewTaskTitle('');
      await fetchTasks();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLane = (lane: string) => {
    setExpandedLanes((prev) => ({
      ...prev,
      [lane]: !prev[lane],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] p-6 text-neutral-300">
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (!tasksData?.configured) {
    return (
      <div className="min-h-screen bg-[#0a1628] p-6">
        <div className="max-w-3xl">
          <h1 className="mb-4 text-2xl font-bold text-[#f5a623]">Overview</h1>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
            <h2 className="font-semibold text-neutral-200">Not Configured</h2>
            <p className="mt-2 text-neutral-400">{tasksData?.message || 'Task tracker not configured'}</p>
            <p className="mt-4 text-sm text-neutral-500">
              To enable: add COWORK_TRACKER_URL and COWORK_TRACKER_SERVICE_ROLE_KEY env vars.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tasks = tasksData.tasks || [];

  // Filter tasks into lanes
  const waitingOnYou = tasks.filter((t) => t.owner && t.due);
  const loopsHandling = tasks.filter((t) => t.legacy_source && t.legacy_source.includes('-loop'));
  const unsorted = tasks.filter((t) => !t.owner && !t.due);

  // Sort waitingOnYou by due date
  waitingOnYou.sort((a, b) => {
    const dateA = a.due ? new Date(a.due).getTime() : Infinity;
    const dateB = b.due ? new Date(b.due).getTime() : Infinity;
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-[#0a1628] p-6 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-[#f5a623]">Overview</h1>

        {/* Capture Box */}
        <div className="mb-8 flex gap-2 rounded-lg border border-neutral-700 bg-neutral-800 p-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
            }}
            placeholder="Add a new task..."
            className="flex-1 bg-transparent px-3 py-2 text-neutral-200 placeholder-neutral-500 outline-none"
          />
          <button
            onClick={handleAddTask}
            disabled={submitting || !newTaskTitle.trim()}
            className="rounded bg-[#f5a623] px-4 py-2 font-semibold text-neutral-900 hover:bg-[#d48610] disabled:opacity-50"
          >
            Add Task
          </button>
        </div>

        {/* Three Lanes */}
        <div className="space-y-4">
          <TaskLane
            title="WAITING ON YOU"
            count={waitingOnYou.length}
            expanded={expandedLanes.waiting}
            onToggle={() => toggleLane('waiting')}
            tasks={waitingOnYou}
            renderTask={(task) => (
              <div className="flex items-baseline justify-between">
                <span className="text-neutral-200">{task.title}</span>
                {task.due && (
                  <span className="ml-4 whitespace-nowrap text-sm text-neutral-500">
                    {new Date(task.due).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          />

          <TaskLane
            title="THE LOOPS ARE HANDLING"
            count={loopsHandling.length}
            expanded={expandedLanes.loops}
            onToggle={() => toggleLane('loops')}
            tasks={loopsHandling}
            renderTask={(task) => (
              <div className="flex items-baseline justify-between">
                <span className="text-neutral-200">{task.title}</span>
                {task.legacy_source && (
                  <span className="ml-4 whitespace-nowrap text-xs text-neutral-500">{task.legacy_source}</span>
                )}
              </div>
            )}
          />

          <TaskLane
            title="UNSORTED"
            count={unsorted.length}
            expanded={expandedLanes.unsorted}
            onToggle={() => toggleLane('unsorted')}
            tasks={unsorted}
            renderTask={(task) => (
              <div className="flex items-baseline justify-between">
                <span className="text-neutral-200">{task.title}</span>
                {task.project && <span className="ml-4 text-xs text-neutral-500">{task.project}</span>}
              </div>
            )}
          />
        </div>

        <div className="mt-8">
          <p className="text-sm text-neutral-500">
            Existing 4-tab widgets to be integrated below
          </p>
        </div>
      </div>
    </div>
  );
}

interface TaskLaneProps {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  tasks: Task[];
  renderTask: (task: Task) => React.ReactNode;
}

function TaskLane({ title, count, expanded, onToggle, tasks, renderTask }: TaskLaneProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-6 py-4 hover:bg-neutral-700/50"
      >
        <span className="text-lg text-neutral-400">{expanded ? '−' : '+'}</span>
        <span className="font-semibold text-neutral-100">{title}</span>
        <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-700 text-sm text-neutral-300">
          {count}
        </span>
      </button>

      {expanded && tasks.length > 0 && (
        <div className="border-t border-neutral-700 bg-neutral-900/50 px-6 py-4">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 py-2">
                <div className="mt-1 flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-neutral-600" />
                </div>
                <div className="flex-1 text-sm">{renderTask(task)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && tasks.length === 0 && (
        <div className="border-t border-neutral-700 bg-neutral-900/50 px-6 py-4 text-center text-sm text-neutral-500">
          No tasks
        </div>
      )}
    </div>
  );
}
