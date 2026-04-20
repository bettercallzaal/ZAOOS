'use client';

import AgentCard from './AgentCard';
import type { AgentStatus, AgentEvent } from './constants';

export default function SquadCircle({
  agents,
  allEvents,
}: {
  agents: AgentStatus[];
  allEvents: AgentEvent[];
}) {
  const zoe = agents.find((a) => a.name === 'zoe');
  const others = agents.filter((a) => a.name !== 'zoe');

  return (
    <div>
      {/* Desktop: circular layout */}
      <div className="hidden md:block relative w-full max-w-3xl mx-auto" style={{ height: '600px' }}>
        {/* ZOE center */}
        {zoe && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56">
            <AgentCard
              agent={zoe}
              recentEvents={allEvents.filter((e) => e.agent_name === 'zoe')}
            />
          </div>
        )}

        {/* SVG lines from center to each agent */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {others.map((agent, i) => {
            const angle = (i * 360) / others.length - 90;
            const rad = (angle * Math.PI) / 180;
            const radius = 220;
            const cx = 50;
            const cy = 50;
            const x2 = cx + Math.cos(rad) * (radius / 6);
            const y2 = cy + Math.sin(rad) * (radius / 6);
            const isActive = agent.status === 'active';
            return (
              <line
                key={agent.name}
                x1={`${cx}%`}
                y1={`${cy}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={isActive ? agent.color : '#ffffff15'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '4 4'}
              />
            );
          })}
        </svg>

        {/* Orbiting agents */}
        {others.map((agent, i) => {
          const angle = (i * 360) / others.length - 90;
          const rad = (angle * Math.PI) / 180;
          const radius = 220;
          const x = 50 + Math.cos(rad) * (radius / 3.5);
          const y = 50 + Math.sin(rad) * (radius / 3.5);
          return (
            <div
              key={agent.name}
              className="absolute w-52"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1,
              }}
            >
              <AgentCard
                agent={agent}
                recentEvents={allEvents.filter((e) => e.agent_name === agent.name)}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-3 p-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.name}
            agent={agent}
            recentEvents={allEvents.filter((e) => e.agent_name === agent.name)}
          />
        ))}
      </div>
    </div>
  );
}
