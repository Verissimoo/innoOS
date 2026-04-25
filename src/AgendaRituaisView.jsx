import React, { useState } from 'react';
import { Plus, X, Calendar, Clock, CheckSquare, History, ChevronDown, ChevronUp } from 'lucide-react';
import { COMPROMISSOS as INIT_COMP, RITUAIS as INIT_RIT } from './data';

const TIPOS_COMP = ['Reunião Cliente', 'Interna', 'Entrega', 'Outro'];
const TIPO_COLORS = {
  'Reunião Cliente': '#00FFB2',
  'Interna': '#60A5FA',
  'Entrega': '#FFB800',
  'Outro': '#94A3B8',
};

export default function AgendaRituaisView() {
  const [tab, setTab] = useState('agenda');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda & Rituais</h1>
          <p className="page-subtitle">Compromissos e rotinas da operação</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'agenda' ? ' active' : ''}`} onClick={() => setTab('agenda')}>
          📅 Agenda
        </button>
        <button className={`tab-btn${tab === 'rituais' ? ' active' : ''}`} onClick={() => setTab('rituais')}>
          🔁 Rituais
        </button>
      </div>

      {tab === 'agenda' ? <AgendaTab /> : <RituaisTab />}
    </div>
  );
}

// ─── AGENDA ──────────────────────────────────
function AgendaTab() {
  const [compromissos, setCompromissos] = useState(INIT_COMP);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', data: '', hora: '', tipo: 'Reunião Cliente', descricao: '' });
  const [errors, setErrors] = useState({});

  const today = new Date();
  const next7 = [...compromissos]
    .filter(c => {
      const diff = (new Date(c.data) - today) / 86400000;
      return diff >= -1 && diff <= 30;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const validate = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Obrigatório';
    if (!form.data) e.data = 'Obrigatório';
    if (!form.hora) e.hora = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    setCompromissos(prev => [...prev, { ...form, id: Date.now() }]);
    setModal(false);
    setForm({ titulo: '', data: '', hora: '', tipo: 'Reunião Cliente', descricao: '' });
  };

  const formatDate = (d) => {
    const date = new Date(d + 'T12:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Novo Compromisso
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {next7.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
            Nenhum compromisso nos próximos 30 dias.
          </div>
        )}
        {next7.map(c => {
          const color = TIPO_COLORS[c.tipo] || '#94A3B8';
          return (
            <div key={c.id} className="card" style={{ padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ minWidth: 90, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase' }}>Data</div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, marginTop: 2 }}>{formatDate(c.data)}</div>
                  <div style={{ fontSize: '0.8rem', color, fontWeight: 700 }}>{c.hora}</div>
                </div>
                <div style={{ height: 40, width: 1, background: 'var(--border)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.titulo}</span>
                    <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30`, fontSize: '0.65rem' }}>{c.tipo}</span>
                  </div>
                  {c.descricao && <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{c.descricao}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Novo Compromisso</span>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className={`form-input${errors.titulo ? ' error' : ''}`} placeholder="Ex: Review com Passagens"
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
                {errors.titulo && <span className="form-error">{errors.titulo}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Data *</label>
                  <input className={`form-input${errors.data ? ' error' : ''}`} type="date"
                    value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                  {errors.data && <span className="form-error">{errors.data}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Hora *</label>
                  <input className={`form-input${errors.hora ? ' error' : ''}`} type="time"
                    value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
                  {errors.hora && <span className="form-error">{errors.hora}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {TIPOS_COMP.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-textarea" placeholder="Detalhes do compromisso..."
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd}><Plus size={15} /> Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RITUAIS ─────────────────────────────────
function RituaisTab() {
  const [rituais, setRituais] = useState(INIT_RIT);
  const [expanded, setExpanded] = useState(null);
  const [editingNota, setEditingNota] = useState(null);
  const [notaText, setNotaText] = useState('');

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const saveNota = (id) => {
    if (!notaText.trim()) return;
    setRituais(prev => prev.map(r => r.id === id ? {
      ...r,
      ultimaOcorrencia: {
        data: new Date().toLocaleDateString('pt-BR'),
        nota: notaText.trim(),
      }
    } : r));
    setEditingNota(null);
    setNotaText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rituais.map(r => {
        const isOpen = expanded === r.id;
        return (
          <div key={r.id} className="card" style={{ overflow: 'hidden' }}>
            {/* Header do ritual */}
            <div
              style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
              onClick={() => toggle(r.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{r.nome}</span>
                  <span className="badge" style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA', border: '1px solid #60A5FA30', fontSize: '0.65rem' }}>
                    {r.frequencia}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {r.duracao}
                  </span>
                  {r.ultimaOcorrencia && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <History size={12} /> Última: {r.ultimaOcorrencia.data}
                    </span>
                  )}
                </div>
              </div>
              {isOpen ? <ChevronUp size={18} color="var(--text-2)" /> : <ChevronDown size={18} color="var(--text-2)" />}
            </div>

            {isOpen && (
              <div style={{ padding: '0 22px 20px', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Objetivo e Pauta */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Objetivo</div>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-2)', marginBottom: 16 }}>{r.objetivo}</p>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      <CheckSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Pauta Padrão
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {r.pauta.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Última Ocorrência */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      <History size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Última Ocorrência
                    </div>

                    {r.ultimaOcorrencia && (
                      <div style={{ padding: '12px 14px', background: 'rgba(0,255,178,0.04)', border: '1px solid rgba(0,255,178,0.15)', borderRadius: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, marginBottom: 6 }}>{r.ultimaOcorrencia.data}</div>
                        <div style={{ fontSize: '0.845rem', lineHeight: 1.55, color: 'var(--text-2)' }}>{r.ultimaOcorrencia.nota}</div>
                      </div>
                    )}

                    {editingNota === r.id ? (
                      <div>
                        <textarea
                          className="form-textarea"
                          style={{ minHeight: 80, marginBottom: 8 }}
                          placeholder="Registrar ata ou notas desta ocorrência..."
                          value={notaText}
                          onChange={e => setNotaText(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingNota(null)}>Cancelar</button>
                          <button className="btn btn-primary btn-sm" onClick={() => saveNota(r.id)}>Salvar Nota</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingNota(r.id); setNotaText(''); }}>
                        <Plus size={14} /> Registrar Ocorrência
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
