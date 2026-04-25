import React, { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Clock, User, CheckSquare, History, ChevronRight, Target, Activity } from 'lucide-react';
import { RITUAIS } from './data';

// Complementando rituais do data com informações de pauta e histórico para a view de detalhes
const RITUAIS_COMPLETO = RITUAIS.map(r => ({
  ...r,
  duration: r.id === 1 ? '15 min' : '1h',
  responsible: r.id === 1 ? 'Lucas Souza' : r.id === 3 ? 'Felipe V.' : 'Tech Lead',
  participants: ['Time Ops', 'Tech Lead', 'CS'],
  objective: `Sincronização e alinhamento de ${r.name.toLowerCase()} para garantir fluidez operacional.`,
  status: r.lastStatus,
  pauta: [
    { id: 1, label: 'Alinhamento de metas', completed: true },
    { id: 2, label: 'Remoção de impedimentos', completed: false },
    { id: 3, label: 'Próximos passos', completed: false },
  ],
  history: [
    { date: '12/04/2026', title: 'Última Execução', notes: 'Ritual realizado conforme pauta. Todos os pontos foram endereçados.' },
  ]
}));

export default function RituaisView() {
  const [selectedRitual, setSelectedRitual] = useState(null);

  if (selectedRitual) {
    return (
      <div className="ritual-detail fade-in">
        <header className="ritual-detail-header">
          <button className="back-btn" onClick={() => setSelectedRitual(null)}>
            <ArrowLeft size={18} />
            <span>Voltar para rituais</span>
          </button>
          <div className="header-title-row">
             <div className="ritual-icon-large">
               <Activity size={32} />
             </div>
             <div>
               <h1>{selectedRitual.name}</h1>
               <div className="detail-meta">
                 <span className="meta-item"><Calendar size={14} /> {selectedRitual.frequency}</span>
                 <span className="meta-item"><Clock size={14} /> {selectedRitual.duration}</span>
                 <span className={`status-pill ${selectedRitual.status.toLowerCase()}`}>
                   Último: {selectedRitual.status}
                 </span>
               </div>
             </div>
             <button className="btn-primary start-btn">Iniciar Ritual</button>
          </div>
        </header>

        <div className="ritual-grid">
          <div className="ritual-main">
            <section className="detail-card">
              <div className="card-header">
                <Target size={20} className="header-icon" />
                <h2>Objetivo do Ritual</h2>
              </div>
              <p className="objective-text">{selectedRitual.objective}</p>
            </section>

            <section className="detail-card">
              <div className="card-header">
                <CheckSquare size={20} className="header-icon" />
                <h2>Checklist de Pauta Padrão</h2>
              </div>
              <div className="checklist">
                {selectedRitual.pauta.map((item) => (
                  <label key={item.id} className="checklist-item">
                    <input type="checkbox" defaultChecked={item.completed} />
                    <span className="checkmark"></span>
                    <span className="item-label">{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="detail-card">
              <div className="card-header">
                <History size={20} className="header-icon" />
                <h2>Histórico de Ocorrências</h2>
              </div>
              <div className="ritual-history">
                {selectedRitual.history.map((h, idx) => (
                  <div key={idx} className="history-entry">
                    <div className="entry-header">
                      <span className="entry-date">{h.date}</span>
                      <span className="entry-title">{h.title}</span>
                    </div>
                    <div className="entry-content">
                       {h.notes}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="ritual-side">
            <section className="detail-card">
              <h2>Participantes</h2>
              <div className="participants-list">
                {selectedRitual.participants.map((p, idx) => (
                  <div key={idx} className="participant">
                    <div className="p-avatar">{p.charAt(0)}</div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-card">
              <h2>Responsável</h2>
              <div className="participant">
                <div className="p-avatar responsible">{selectedRitual.responsible.charAt(0)}</div>
                <span>{selectedRitual.responsible}</span>
              </div>
            </section>
          </aside>
        </div>

        <style jsx>{`
          .ritual-detail { padding: 40px; display: flex; flex-direction: column; gap: 32px; flex: 1; }
          .back-btn { display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 0.9rem; margin-bottom: 24px; }
          .back-btn:hover { color: var(--primary); }
          .header-title-row { display: flex; align-items: center; gap: 24px; position: relative; }
          .ritual-icon-large { width: 64px; height: 64px; border-radius: 18px; background: rgba(0, 255, 178, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0, 255, 178, 0.2); }
          h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
          .detail-meta { display: flex; gap: 20px; align-items: center; }
          .meta-item { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-dim); }
          .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
          .status-pill.realizado { background: rgba(0, 255, 178, 0.2); color: #00FFB2; }
          .status-pill.pendente { background: rgba(255, 215, 0, 0.2); color: #FFD700; }
          .start-btn { position: absolute; right: 0; padding: 12px 24px; font-size: 1rem; }
          .ritual-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
          .ritual-main, .ritual-side { display: flex; flex-direction: column; gap: 24px; }
          .detail-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 24px; }
          .detail-card h2 { font-size: 1rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
          .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
          .header-icon { color: var(--primary); }
          .objective-text { color: var(--text-main); line-height: 1.6; font-size: 1.05rem; }
          .checklist { display: flex; flex-direction: column; gap: 12px; }
          .checklist-item { display: flex; align-items: center; gap: 12px; cursor: pointer; position: relative; padding: 4px 0; }
          .checklist-item input { display: none; }
          .checkmark { width: 20px; height: 20px; border: 2px solid var(--border-color); border-radius: 6px; position: relative; transition: all 0.2s; }
          .checklist-item input:checked + .checkmark { background: var(--primary); border-color: var(--primary); }
          .checkmark:after { content: ''; position: absolute; display: none; left: 6px; top: 2px; width: 5px; height: 10px; border: solid var(--bg-dark); border-width: 0 2px 2px 0; transform: rotate(45deg); }
          .checklist-item input:checked + .checkmark:after { display: block; }
          .item-label { font-size: 0.95rem; }
          .checklist-item input:checked ~ .item-label { color: var(--text-dim); text-decoration: line-through; }
          .ritual-history { display: flex; flex-direction: column; gap: 16px; }
          .history-entry { padding: 16px; background: rgba(255, 255, 255, 0.02); border-radius: 12px; border-left: 2px solid var(--border-color); transition: border-color 0.2s; }
          .history-entry:hover { border-left-color: var(--primary); }
          .entry-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .entry-date { font-weight: 700; font-size: 0.85rem; color: var(--primary); }
          .entry-title { font-weight: 600; font-size: 0.85rem; color: var(--text-dim); }
          .entry-content { font-size: 0.9rem; color: var(--text-main); line-height: 1.5; }
          .participants-list { display: flex; flex-direction: column; gap: 12px; }
          .participant { display: flex; align-items: center; gap: 12px; }
          .p-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
          .p-avatar.responsible { background: var(--primary); color: var(--bg-dark); border: none; }
          @media (max-width: 1000px) { .ritual-grid { grid-template-columns: 1fr; } .start-btn { position: static; margin-top: 16px; width: 100%; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="rituais-content fade-in">
      <header className="rituais-header">
        <div>
          <h1>Rituais Operacionais</h1>
          <p className="subtitle">Gestão das rotinas e reuniões recorrentes da Innohvasion</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          <span>Novo Ritual</span>
        </button>
      </header>

      <section className="rituais-list-grid">
        {RITUAIS_COMPLETO.map((ritual) => (
          <div key={ritual.id} className="ritual-card" onClick={() => setSelectedRitual(ritual)}>
            <div className="ritual-card-top">
              <div className="ritual-badge">{ritual.frequency}</div>
              <span className={`status-tag ${ritual.status.toLowerCase()}`}>
                {ritual.status}
              </span>
            </div>
            
            <div className="ritual-card-body">
              <h3>{ritual.name}</h3>
              <div className="ritual-meta">
                <span className="meta-item"><Clock size={14} /> {ritual.duration}</span>
                <span className="meta-item"><User size={14} /> {ritual.responsible}</span>
              </div>
            </div>

            <div className="ritual-card-footer">
              <div className="next-occurrence">
                <Calendar size={14} />
                <span>Prox: {ritual.next}</span>
              </div>
              <ChevronRight size={18} className="arrow-icon" />
            </div>
          </div>
        ))}
      </section>

      <style jsx>{`
        .rituais-content { padding: 40px; display: flex; flex-direction: column; gap: 32px; flex: 1; }
        .rituais-header { display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 1.875rem; font-weight: 700; }
        .subtitle { color: var(--text-dim); font-size: 0.9rem; }
        .btn-primary { background: var(--primary); color: var(--bg-dark); padding: 10px 20px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-primary:hover { transform: scale(1.02); box-shadow: 0 0 15px rgba(0, 255, 178, 0.4); }
        .rituais-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .ritual-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 24px; cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; gap: 16px; }
        .ritual-card:hover { transform: translateY(-5px); border-color: rgba(0, 255, 178, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .ritual-card-top { display: flex; justify-content: space-between; }
        .ritual-badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--primary); background: rgba(0, 255, 178, 0.05); padding: 4px 8px; border-radius: 6px; letter-spacing: 0.05em; }
        .status-tag { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
        .status-tag.realizado { color: #00FFB2; }
        .status-tag.pendente { color: #FFD700; }
        h3 { font-size: 1.15rem; font-weight: 700; }
        .ritual-meta { display: flex; gap: 16px; margin-top: 8px; }
        .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-dim); }
        .ritual-card-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .next-occurrence { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-dim); }
        .arrow-icon { color: var(--text-dim); transition: transform 0.2s, color 0.2s; }
        .ritual-card:hover .arrow-icon { transform: translateX(4px); color: var(--primary); }
      `}</style>
    </div>
  );
}
