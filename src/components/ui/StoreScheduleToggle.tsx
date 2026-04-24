'use client';

import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface DaySchedule {
    open: boolean;
    from: string;
    to: string;
}

interface Props {
    schedule: Record<string, DaySchedule>;
    today: string;
    todaySchedule: DaySchedule | undefined;
    isOpen: boolean;
    daysOrder: string[];
}

export default function StoreScheduleToggle({ schedule, today, todaySchedule, isOpen, daysOrder }: Props) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{ width: '100%' }}>
            {/* Toggle principal */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, width: '100%',
                }}
            >
                <Clock size={14} color="rgba(255,255,255,0.7)" />

                {/* Estado abierto/cerrado */}
                <span style={{
                    fontSize: '0.8rem', fontWeight: 700,
                    color: isOpen ? '#86efac' : '#fca5a5',
                }}>
                    {isOpen ? 'Abierto' : 'Cerrado'}
                </span>

                {/* Horario de hoy */}
                {todaySchedule?.open && (
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
                        · {todaySchedule.from} – {todaySchedule.to}
                    </span>
                )}

                {/* Ícono expandir */}
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)' }}>
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
            </button>

            {/* Horario completo */}
            {expanded && (
                <div style={{
                    marginTop: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                }}>
                    {daysOrder.map(day => {
                        const s = schedule[day];
                        const isToday = day === today;
                        return (
                            <div
                                key={day}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.4rem 0.75rem',
                                    background: isToday ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: isToday ? 700 : 400,
                                    color: isToday ? '#fff' : 'rgba(255,255,255,0.65)',
                                    minWidth: '5rem',
                                }}>
                                    {day}
                                    {isToday && (
                                        <span style={{ fontSize: '0.65rem', marginLeft: '0.375rem', color: 'rgba(255,255,255,0.5)' }}>
                                            (hoy)
                                        </span>
                                    )}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: !s || !s.open
                                        ? 'rgba(255,255,255,0.35)'
                                        : isToday ? '#86efac' : 'rgba(255,255,255,0.8)',
                                }}>
                                    {!s || !s.open ? 'Cerrado' : `${s.from} – ${s.to}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}