'use client';

import { ReactNode, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

export interface KanbanColumn<S extends string> {
  key: S;
  label: string;
  /** tailwind classes for the column header badge */
  accent: string;
  /** optional soft WIP limit — shows warning if count exceeds */
  wipSoftCap?: number;
  /** collapse by default (e.g. declined) */
  defaultCollapsed?: boolean;
}

interface Props<T extends { id: string; status: S }, S extends string> {
  items: T[];
  columns: KanbanColumn<S>[];
  onStatusChange: (id: string, newStatus: S) => void;
  renderCard: (item: T) => ReactNode;
  getStripeColor?: (item: T) => string;
}

export function KanbanBoard<T extends { id: string; status: S }, S extends string>({
  items,
  columns,
  onStatusChange,
  renderCard,
  getStripeColor,
}: Props<T, S>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const item = items.find((i) => i.id === active.id);
    if (!item) return;
    const targetStatus = over.id as S;
    if (targetStatus && targetStatus !== item.status) {
      onStatusChange(item.id, targetStatus);
    }
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-3 pb-2" style={{ scrollbarWidth: 'thin' }}>
        {columns.map((col) => (
          <Column
            key={col.key}
            column={col}
            items={items.filter((i) => i.status === col.key)}
            renderCard={renderCard}
            getStripeColor={getStripeColor}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="bg-[#0d1b2a] rounded-lg border border-[#f5a623]/50 shadow-2xl opacity-90 rotate-2">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column<T extends { id: string; status: S }, S extends string>({
  column,
  items,
  renderCard,
  getStripeColor,
}: {
  column: KanbanColumn<S>;
  items: T[];
  renderCard: (item: T) => ReactNode;
  getStripeColor?: (item: T) => string;
}) {
  const [collapsed, setCollapsed] = useState(column.defaultCollapsed ?? false);
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  const overCap = column.wipSoftCap !== undefined && items.length > column.wipSoftCap;

  return (
    <div className="w-[85vw] sm:w-[280px] shrink-0 snap-start">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${column.accent}`}>
            {column.label}
          </span>
          <span className={`text-xs font-bold ${overCap ? 'text-amber-400' : 'text-gray-500'}`}>
            {items.length}
            {column.wipSoftCap !== undefined && (
              <span className="text-[10px] text-gray-600">/{column.wipSoftCap}</span>
            )}
          </span>
          {overCap && <span className="text-[10px] text-amber-400">⚠ over cap</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] text-gray-500 hover:text-gray-300"
          aria-label={collapsed ? 'Expand column' : 'Collapse column'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </div>
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`min-h-[120px] rounded-lg p-2 space-y-2 transition-colors ${
            isOver ? 'bg-[#f5a623]/10 border border-[#f5a623]/30' : 'bg-white/[0.02] border border-white/[0.04]'
          }`}
        >
          {items.length === 0 && (
            <p className="text-[11px] text-gray-600 text-center py-4">Drag here</p>
          )}
          {items.map((item) => (
            <DraggableCard key={item.id} id={item.id} stripeColor={getStripeColor?.(item)}>
              {renderCard(item)}
            </DraggableCard>
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableCard({
  id,
  stripeColor,
  children,
}: {
  id: string;
  stripeColor?: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ touchAction: 'none' }}
      className={`relative bg-[#0d1b2a] rounded-lg border border-white/[0.06] overflow-hidden cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      {stripeColor && <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripeColor}`} aria-hidden />}
      <div className={stripeColor ? 'pl-2' : ''}>{children}</div>
    </div>
  );
}
