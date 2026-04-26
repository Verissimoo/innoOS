import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Edit2, Download, ArrowRight, Trash2 } from 'lucide-react';
import { STATUS_CONFIG } from './data';
import { supabase } from './lib/supabase';

const COLUMNS = [
  { id: 'Ideia',       label: '💡 Ideia',         color: '#94A3B8' },
  { id: 'Analisando',  label: '🔍 Analisando',     color: '#A78BFA' },
  { id: 'Desenvolvendo',label: '🛠️ Desenvolvendo', color: '#FFB800' },
  { id: 'Pronto',      label: '✅ Pronto',          color: '#00FFB2' },
];

const PRIORIDADE_COLORS = { Alta: '#EF4444', Média: '#FBBF24', Baixa: '#3B82F6' };
const TIPOS = ['Nova Automação', 'Melhoria', 'Novo Cliente Alvo', 'Processo Interno'];
const CATEGORIAS = ['Atendimento', 'Prospecção', 'Financeiro', 'Operacional'];

const emptyForm = { titulo: '', tipo: 'Nova Automação', categoria: 'Atendimento', descricao: '', prioridade: 'Média', prox_passos: '', automacao_id: '' };

export default function BacklogView({ onSelectIdeia }) {
  const [ideias, setIdeias] = useState([]);
  const [automacoes, setAutomacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [ { data: idData, error: idErr }, { data: autData } ] = await Promise.all([
      supabase.from('inn_ideias').select('*').order('created_at', { ascending: false }),
      supabase.from('inn_automacoes').select('id, nome').order('nome')
    ]);
    
    if (idErr) console.error("Erro ao buscar ideias:", idErr);
    
    const automacoesList = autData || [];
    const mappedIdeias = (idData || []).map(ideia => {
      const autId = ideia.extra_info?.automacao_id;
      const aut = automacoesList.find(a => a.id === autId);
      return { ...ideia, inn_automacoes: aut ? { id: aut.id, nome: aut.nome } : null };
    });

    setIdeias(mappedIdeias);
    setAutomacoes(automacoesList);
    setLoading(false);
  }
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState('Todas');
  const [dragOverCol, setDragOverCol] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const filteredIdeias = ideias.filter(i => {
    const matchTipo = tipoFilter === 'Todos' || i.tipo === tipoFilter;
    const matchPrio = prioridadeFilter === 'Todas' || i.prioridade === prioridadeFilter;
    return matchTipo && matchPrio;
  });

  const totalIdeias = ideias.length;
  const altaPrio = ideias.filter(i => i.prioridade === 'Alta').length;
  const desenvolvendo = ideias.filter(i => i.status === 'Desenvolvendo').length;

  const validate = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Obrigatório';
    if (!form.descricao.trim()) e.descricao = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleAdd() {
    if (!validate()) return;
    const payload = {
      titulo: form.titulo,
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao,
      prioridade: form.prioridade,
      status: 'Ideia',
      prox_passos: form.prox_passos,
      extra_info: { automacao_id: form.automacao_id || null }
    };
    const { data, error } = await supabase.from('inn_ideias').insert([payload]).select().single();
    if (error) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
      return;
    }
    
    // Vincula em memória para a interface
    const autId = data.extra_info?.automacao_id;
    const aut = automacoes.find(a => a.id === autId);
    data.inn_automacoes = aut ? { id: aut.id, nome: aut.nome } : null;

    setIdeias(prev => [data, ...prev]);
    setModal(false);
    setForm(emptyForm);
  }

  // Drag & Drop
  const onDragStart = (e, id) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  async function moveIdeia(id, novoStatus) {
    setIdeias(prev => prev.map(i => i.id === id ? { ...i, status: novoStatus } : i));
    await supabase.from('inn_ideias').update({ status: novoStatus }).eq('id', id);
  }

  const onDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    if (dragging === null) return;
    moveIdeia(dragging, colId);
    setDragging(null);
  };

  const onDragOver = (e, colId) => { 
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  // Edit inline
  const startEdit = (card) => { setEditCard(card.id); setEditForm({ ...card, automacao_id: card.extra_info?.automacao_id || '' }); };
  async function saveEdit() {
    const currentIdeia = ideias.find(i => i.id === editCard);
    const newExtraInfo = { ...(currentIdeia.extra_info || {}), automacao_id: editForm.automacao_id || null };

    setIdeias(prev => prev.map(i => i.id === editCard ? { ...i, ...editForm, extra_info: newExtraInfo, inn_automacoes: automacoes.find(a => a.id === editForm.automacao_id) || null } : i));
    
    const { error } = await supabase.from('inn_ideias').update({
      titulo: editForm.titulo,
      descricao: editForm.descricao,
      prioridade: editForm.prioridade,
      prox_passos: editForm.prox_passos,
      extra_info: newExtraInfo,
    }).eq('id', editCard);
    if (error) { alert("Erro ao editar: " + error.message); console.error(error); }
    setEditCard(null);
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta ideia?')) return;
    const { error } = await supabase.from('inn_ideias').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    setIdeias(prev => prev.filter(i => i.id !== id));
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>Carregando dados...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Ideias & Backlog</h1>
          <p className="page-subtitle">Oportunidades e próximos passos da Innohvasion</p>
          
          {/* Metrics */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700 }}>Total de Ideias</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 2 }}>{totalIdeias}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700 }}>Alta Prioridade</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: PRIORIDADE_COLORS['Alta'], marginTop: 2 }}>{altaPrio}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700 }}>Em Desenvolvendo</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FBBF24', marginTop: 2 }}>{desenvolvendo}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => console.log('Exportar clicado')}>
            <Download size={16} /> Exportar
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal(true); }}>
            <Plus size={16} /> Nova Ideia
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600 }}>Filtros:</span>
        <select className="form-select" style={{ width: 'auto', minWidth: 150, padding: '6px 12px', height: 'auto' }} value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}>
          <option value="Todos">Todos os Tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 150, padding: '6px 12px', height: 'auto' }} value={prioridadeFilter} onChange={e => setPrioridadeFilter(e.target.value)}>
          <option value="Todas">Todas as Prioridades</option>
          <option value="Alta">Alta</option>
          <option value="Média">Média</option>
          <option value="Baixa">Baixa</option>
        </select>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {COLUMNS.map(col => {
          const cards = filteredIdeias.filter(i => i.status === col.id);
          const isDragOver = dragOverCol === col.id;
          
          return (
            <div
              key={col.id}
              onDrop={e => onDrop(e, col.id)}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={onDragLeave}
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 14,
                padding: '0',
                minHeight: 400,
                border: isDragOver ? `2px dashed ${col.color}` : '1px solid var(--border)',
                overflow: 'hidden',
                transition: 'border 0.2s'
              }}
            >
              {/* Colored Line Top */}
              <div style={{ width: '100%', height: 3, background: col.color }} />
              
              <div style={{ padding: '14px 12px' }}>
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: col.color }}>{col.label}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 99 }}>
                    {cards.length}
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.8rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                      Nenhuma ideia aqui ainda
                    </div>
                  ) : cards.map(card => (
                    editCard === card.id ? (
                      /* Edit inline */
                      <div key={card.id} className="card" style={{ padding: 14, border: `1px solid ${col.color}50` }}>
                        <input className="form-input" style={{ marginBottom: 8, fontSize: '0.85rem' }} value={editForm.titulo}
                          onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} />
                        <textarea className="form-textarea" style={{ fontSize: '0.8rem', marginBottom: 8, minHeight: 60 }} value={editForm.descricao}
                          onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <select className="form-select" style={{ fontSize: '0.78rem', flex: 1 }} value={editForm.prioridade}
                            onChange={e => setEditForm(f => ({ ...f, prioridade: e.target.value }))}>
                            <option>Alta</option><option>Média</option><option>Baixa</option>
                          </select>
                          <select className="form-select" style={{ fontSize: '0.78rem', flex: 1 }} value={editForm.automacao_id || ''}
                            onChange={e => setEditForm(f => ({ ...f, automacao_id: e.target.value }))}>
                            <option value="">Sem vínculo</option>
                            {automacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                          </select>
                        </div>
                        <textarea className="form-textarea" style={{ fontSize: '0.78rem', marginBottom: 10, minHeight: 50 }} placeholder="Próximos passos..."
                          value={editForm.prox_passos || ''} onChange={e => setEditForm(f => ({ ...f, prox_passos: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setEditCard(null)}><X size={13} /></button>
                          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={saveEdit}><Check size={13} /></button>
                        </div>
                      </div>
                    ) : (
                      /* Normal card */
                      <div
                        key={card.id}
                        className="card hoverable"
                        draggable
                        onDragStart={e => onDragStart(e, card.id)}
                        onMouseEnter={() => setHoveredCard(card.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => onSelectIdeia && onSelectIdeia(card)}
                        style={{ 
                          padding: '14px 16px', 
                          cursor: 'pointer', 
                          opacity: dragging === card.id ? 0.5 : 1, 
                          userSelect: 'none',
                          borderLeft: `3px solid ${PRIORIDADE_COLORS[card.prioridade] || 'var(--border)'}`,
                          position: 'relative'
                        }}
                      >
                        {/* Hover Buttons */}
                        {hoveredCard === card.id && (
                          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                            <button 
                              className="btn btn-ghost" 
                              style={{ padding: 4, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                              onClick={(e) => { e.stopPropagation(); startEdit(card); }}
                              title="Editar"
                            >
                              <Edit2 size={12} color="var(--text-2)" />
                            </button>
                            <button 
                              className="btn btn-ghost" 
                              style={{ padding: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#EF4444' }}
                              onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }}
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}

                        {/* Tipo */}
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                            {card.tipo}
                          </span>
                          {card.inn_automacoes && (
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-dim)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={card.inn_automacoes.nome}>
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

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                            {card.categoria}
                          </span>
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
                  <label className="form-label">Automação Vinculada (Opcional)</label>
                  <select className="form-select" value={form.automacao_id || ''} onChange={e => setForm(f => ({ ...f, automacao_id: e.target.value }))}>
                    <option value="">Nenhuma</option>
                    {automacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
              </div>

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
              <button className="btn btn-primary" onClick={handleAdd}><Plus size={15} /> Criar Ideia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
