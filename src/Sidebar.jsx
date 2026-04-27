import React from 'react';
import { LayoutDashboard, Zap, Users, Lightbulb, ClipboardList, DollarSign, CalendarDays } from 'lucide-react';

const NAV = [
  { id: 'dashboard',   label: 'Visão Geral',           icon: LayoutDashboard },
  { id: 'automacoes',  label: 'Automações e Sistemas', icon: Zap },
  { id: 'clientes',    label: 'Clientes',              icon: Users },
  { id: 'backlog',     label: 'Ideias & Backlog',      icon: Lightbulb },
  { id: 'processos',   label: 'Processos',             icon: ClipboardList },
  { id: 'financeiro',  label: 'Financeiro',            icon: DollarSign },
  { id: 'agenda',      label: 'Agenda & Rituais',      icon: CalendarDays },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <Zap size={18} strokeWidth={2.5} />
        </div>
        <div className="logo-name">Inno<span>OS</span></div>
      </div>

      {/* Nav */}
      <div className="sidebar-label">Menu</div>
      <nav>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item${active === id ? ' active' : ''}`}
            onClick={() => onSelect(id)}
          >
            <Icon size={18} className="nav-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">Innohvasion OS · v1.0</div>
    </aside>
  );
}
