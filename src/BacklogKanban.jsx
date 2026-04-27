import React, { useState } from 'react';
import { Plus, X, Check, Edit2, ArrowRight, Trash2, Calendar } from 'lucide-react';

const COLUMNS = [
  { id: 'Ideia',         label: '💡 Ideia',          color: '#94A3B8' },
  { id: 'Analisando',    label: '🔍 Analisando',     color: '#A78BFA' },
  { id: 'Desenvolvendo', label: '🛠️ Desenvolvendo',  color: '#FFB800' },
  { id: 'Pronto',        label: '✅ Pronto',          color: '#00FFB2' },
];

const PRIORIDADE_COLORS = { Alta: '#EF4444', Média: '#FBBF24', Baixa: '#3B82F6' };
export const RESPONSAVEIS = ['Verissimo', 'Luis', 'Hide'];
export const RESP_COLORS = { Verissimo: '#7C3AED', Luis: '#0EA5E9', Hide: '#10B981' };

const TIPOS = ['Nova Automação', 'Melhoria', 'Novo Cliente Alvo', 'Processo Interno'];
const CATEGORIAS = ['Atendimento', 'Prospecção', 'Financeiro', 'Operacional'];

const emptyForm = {
  titulo: '', tipo: 'Nova Automação', categoria: 'Atendimento',
  descricao: '', prioridade: 'Média', prox_passos: '',
  automacao_id: '', responsavel: '', prazo: ''
};

export function ResponsavelAvatar({ nome, size = 22 }) {
  if (!nome) return null;
  const cor = RESP_COLORS[nome] || '#666';
  return (
    <div title={nome} style={{
      width: size, height: size, borderRadius: '50%',
      background: cor, color: '#fff', fontSize: size * 0.42, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

export function PrazoTag({ prazo }) {
  if (!prazo) return null;
  const d = new Date(prazo + 'T12:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diffDias = Math.ceil((d - hoje) / 86400000);

  let cor = 'var(--text-2)';
  let bg = 'rgba(255,255,255,0.04)';
  let label = d.toLocaleDateString('pt-BR');

  if (diffDias < 0) {
    cor = '#EF4444';
    bg = 'rgba(239,68,68,0.12)';
    label = `${label} (atrasado)`;
  } else if (diffDias < 3) {
    cor = '#FBBF24';
    bg = 'rgba(251,191,36,0.12)';
    if (diffDias === 0) label = `${label} (hoje)`;
    else label = `${label} (${diffDias}d)`;
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.7rem', fontWeight: 600, color: cor,
      padding: '2px 8px', borderRadius: 99, background: bg, whiteSpace: 'nowrap'
    }}>
      <Calendar size={11} /> {label}
    </span>
  );
}

export default function BacklogKanban({
  ideias,
  automacoes = [],
  automacaoFixa = null,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  onSelectIdeia
}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const [dragging, setDragging] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const [editCard, setEditCard] = useState(null);
  const [editForm, setEditForm] = useState({});

  const validate = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Obrigatório';
    if (!form.descricao.trim()) e.descricao = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleCreate() {
    if (!validate()) return;
    const payload = {
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      prioridade: form.prioridade,
      status: 'Ideia',
      prox_passos: form.prox_passos || null,
      responsavel: form.responsavel || null,
      prazo: form.prazo || null,
      automacao_id: automacaoFixa || form.automacao_id || null,
    };
    const ok = await onCreate(payload);
    if (ok !== false) {
      setModal(false);
      setForm(emptyForm);
      setErrors({});
    }
  }

  // Drag & Drop
  const onDragStart = (e, id) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
  };
  const onDragLeave = () => setDragOverCol(null);
  const onDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    if (dragging === null) return;
    const ideia = ideias.find(i => i.id === dragging);
    if (ideia && ideia.status !== colId) onMove(dragging, colId);
    setDragging(null);
  };

  // Edit inline
  const startEdit = (card) => {
    setEditCard(card.id);
    setEditForm({
      titulo: card.titulo || '',
      descricao: card.descricao || '',
      prioridade: card.prioridade || 'Média',
      prox_passos: card.prox_passos || '',
      responsavel: card.responsavel || '',
      prazo: card.prazo || '',
      automacao_id: card.automacao_id || ''
    });
  };

  async function saveEdit() {
    const payload = {
      titulo: editForm.titulo,
      descricao: editForm.descricao,
      prioridade: editForm.prioridade,
      prox_passos: editForm.prox_passos || null,
      responsavel: editForm.responsavel || null,
      prazo: editForm.prazo || null,
      automacao_id: automacaoFixa || editForm.automacao_id || null
    };
    const ok = await onUpdate(editCard, payload);
    if (ok !== false) setEditCard(null);
  }

  return (
    <div>
      {/* Botão criar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setModal(true); }}>
          <Plus size={16} /> Nova ideia
        </button>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {COLUMNS.map(col => {
          const cards = ideias.filter(i => i.status === col.id);
          const isDragOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDrop={e => onDrop(e, col.id)}
              onDragOver={e => onDragOver(e, col.id)}
              onDragLeave={onDragLeave}
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 14, padding: 0, minHeight: 400,
                border: isDragOver ? `2px dashed ${col.color}` : '1px solid var(--border)',
                overflow: 'hidden', transition: 'border 0.2s'
              }}
            >
              <div style={{ width: '100%', height: 3, background: col.color }} />

              <div style={{ padding: '14px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: col.color }}>{col.label}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 99 }}>
                    {cards.length}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.8rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                      Nenhuma ideia aqui ainda
                    </div>
                  ) : cards.map(card => (
                    editCard === card.id ? (
                      <div key={card.id} className="card" style={{ padding: 14, border: `1px solid ${col.color}50` }}>
                        <input className="form-input" style={{ marginBottom: 8, fontSize: '0.85rem' }}
                          value={editForm.titulo} onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} />
                        <textarea className="form-textarea" style={{ fontSize: '0.8rem', marginBottom: 8, minHeight: 60 }}
                          value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <select className="form-select" style={{ fontSize: '0.78rem', flex: 1 }}
                            value={editForm.prioridade} onChange={e => setEditForm(f => ({ ...f, prioridade: e.target.value }))}>
                            <option>Alta</option><option>Média</option><option>Baixa</option>
                          </select>
                          <select className="form-select" style={{ fontSize: '0.78rem', flex: 1 }}
                            value={editForm.responsavel} onChange={e => setEditForm(f => ({ ...f, responsavel: e.target.value }))}>
                            <option value="">Sem responsável</option>
                            {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <input className="form-input" type="date" style={{ marginBottom: 8, fontSize: '0.78rem' }}
                          value={editForm.prazo} onChange={e => setEditForm(f => ({ ...f, prazo: e.target.value }))} />
                        {!automacaoFixa && (
                          <select className="form-select" style={{ fontSize: '0.78rem', marginBottom: 8 }}
                            value={editForm.automacao_id} onChange={e => setEditForm(f => ({ ...f, automacao_id: e.target.value }))}>
                            <option value="">— Nenhuma —</option>
                            {automacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                          </select>
                        )}
                        <textarea className="form-textarea" style={{ fontSize: '0.78rem', marginBottom: 10, minHeight: 50 }} placeholder="Próximos passos..."
                          value={editForm.prox_passos || ''} onChange={e => setEditForm(f => ({ ...f, prox_passos: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setEditCard(null)}><X size={13} /></button>
                          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={saveEdit}><Check size={13} /></button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={card.id}
                        className="card hoverable"
                        draggable
                        onDragStart={e => onDragStart(e, card.id)}
                        onMouseEnter={() => setHoveredCard(card.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onSelectIdeia && onSelectIdeia(card)}
                        style={{
                          padding: '14px 16px', cursor: onSelectIdeia ? 'pointer' : 'grab',
                          opacity: dragging === card.id ? 0.5 : 1, userSelect: 'none',
                          borderLeft: `3px solid ${PRIORIDADE_COLORS[card.prioridade] || 'var(--border)'}`,
                          position: 'relative'
                        }}
                      >
                        {hoveredCard === card.id && (
                          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost"
                              style={{ padding: 4, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                              onClick={e => { e.stopPropagation(); startEdit(card); }}
                              title="Editar">
                              <Edit2 size={12} color="var(--text-2)" />
                            </button>
                            <button className="btn btn-ghost"
                              style={{ padding: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#EF4444' }}
                              onClick={e => { e.stopPropagation(); onDelete(card.id); }}
                              title="Excluir">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}

                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                            {card.tipo}
                          </span>
                          {!automacaoFixa && card.inn_automacoes && (
                            <span title={card.inn_automacoes.nome}
                              style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-dim)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                              🔗 {card.inn_automacoes.nome}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, marginBottom: 8, paddingRight: 20 }}>{card.titulo}</div>

                        <div style={{
                          fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12,
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {card.descricao}
                        </div>

                        {card.prox_passos && (
                          <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                            <ArrowRight size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary)' }} />
                            <div>{card.prox_passos}</div>
                          </div>
                        )}

                        {/* Footer com responsável, prazo, prioridade */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <ResponsavelAvatar nome={card.responsavel} />
                            <PrazoTag prazo={card.prazo} />
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: PRIORIDADE_COLORS[card.prioridade], padding: '2px 8px', borderRadius: 99, background: `${PRIORIDADE_COLORS[card.prioridade]}20` }}>
                            {card.prioridade}
                          </span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nova Ideia */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nova Ideia</span>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className={`form-input${errors.titulo ? ' error' : ''}`} placeholder="Ex: Chatbot para salões de beleza"
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
                {errors.titulo && <span className="form-error">{errors.titulo}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <select className="form-select" value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Atribuir para</label>
                  <select className="form-select" value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}>
                    <option value="">— Sem responsável —</option>
                    {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data limite</label>
                  <input className="form-input" type="date"
                    value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
                </div>
              </div>

              {!automacaoFixa && (
                <div className="form-group">
                  <label className="form-label">Vincular a projeto</label>
                  <select className="form-select" value={form.automacao_id || ''}
                    onChange={e => setForm(f => ({ ...f, automacao_id: e.target.value }))}>
                    <option value="">— Nenhuma —</option>
                    {automacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <textarea className={`form-textarea${errors.descricao ? ' error' : ''}`} placeholder="Descreva a ideia e seu potencial..."
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                {errors.descricao && <span className="form-error">{errors.descricao}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Próximos Passos</label>
                <textarea className="form-textarea" style={{ minHeight: 60 }} placeholder="O que precisa ser feito para avançar?"
                  value={form.prox_passos || ''} onChange={e => setForm(f => ({ ...f, prox_passos: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}><Plus size={15} /> Criar Ideia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
