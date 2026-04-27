import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Trash2, Filter, ClipboardList } from 'lucide-react';
import { supabase } from './lib/supabase';
import { ResponsavelAvatar, PrazoTag, RESPONSAVEIS } from './BacklogKanban';

const COLUMNS = [
  { id: 'A Fazer',      label: '📋 A Fazer',      color: '#94A3B8' },
  { id: 'Em Andamento', label: '⚡ Em Andamento', color: '#FBBF24' },
  { id: 'Aguardando',   label: '⏳ Aguardando',   color: '#A78BFA' },
  { id: 'Concluído',    label: '✅ Concluído',    color: '#00FFB2' },
];

const CATEGORIAS = ['Administrativo', 'Jurídico', 'Financeiro', 'Comercial', 'Operacional'];
const PRIORIDADES = ['Alta', 'Média', 'Baixa'];
const PRIO_COLORS = { Alta: '#EF4444', Média: '#FBBF24', Baixa: '#3B82F6' };

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const emptyForm = {
  titulo: '', categoria: 'Operacional', prioridade: 'Média',
  responsavel: '', prazo: '', descricao: '', observacoes: '',
  checklist: [], status: 'A Fazer'
};

export default function ProcessosView() {
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [respFilter, setRespFilter] = useState('Todos');
  const [prioFilter, setPrioFilter] = useState('Todas');
  const [catFilter, setCatFilter] = useState('Todas');

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [novoChecklistItem, setNovoChecklistItem] = useState('');

  const [dragging, setDragging] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('inn_processos').select('*').order('created_at', { ascending: false });
      if (error) { console.error('Erro ao carregar processos:', error); alert('Erro ao carregar processos: ' + error.message); }
      setProcessos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ============ FILTROS / MÉTRICAS ============
  const filtered = processos.filter(p => {
    if (respFilter !== 'Todos' && p.responsavel !== respFilter) return false;
    if (prioFilter !== 'Todas' && p.prioridade !== prioFilter) return false;
    if (catFilter !== 'Todas' && p.categoria !== catFilter) return false;
    return true;
  });

  const totalAFazer = processos.filter(p => p.status === 'A Fazer').length;
  const totalEmAndamento = processos.filter(p => p.status === 'Em Andamento').length;

  const semanaLimite = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })();
  const vencendoSemana = processos.filter(p => {
    if (!p.prazo || p.status === 'Concluído') return false;
    const d = new Date(p.prazo + 'T12:00');
    return d <= semanaLimite;
  }).length;

  // ============ CRUD ============
  function openModal(processo = null) {
    if (processo) {
      setForm({
        titulo: processo.titulo || '',
        categoria: processo.categoria || 'Operacional',
        prioridade: processo.prioridade || 'Média',
        responsavel: processo.responsavel || '',
        prazo: processo.prazo || '',
        descricao: processo.descricao || '',
        observacoes: processo.observacoes || '',
        checklist: Array.isArray(processo.checklist) ? processo.checklist : [],
        status: processo.status || 'A Fazer'
      });
      setEditId(processo.id);
    } else {
      setForm(emptyForm);
      setEditId(null);
    }
    setNovoChecklistItem('');
    setErrors({});
    setModal(true);
  }

  function validate() {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const payload = {
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      prioridade: form.prioridade,
      responsavel: form.responsavel || null,
      prazo: form.prazo || null,
      descricao: form.descricao || null,
      observacoes: form.observacoes || null,
      checklist: form.checklist || [],
      status: form.status
    };

    if (editId) {
      const { data, error } = await supabase.from('inn_processos').update(payload).eq('id', editId).select().single();
      if (error) { console.error(error); alert('Erro ao atualizar: ' + error.message); return; }
      setProcessos(prev => prev.map(p => p.id === editId ? data : p));
    } else {
      const { data, error } = await supabase.from('inn_processos').insert([payload]).select().single();
      if (error) { console.error(error); alert('Erro ao salvar: ' + error.message); return; }
      setProcessos(prev => [data, ...prev]);
    }

    setModal(false);
    setForm(emptyForm);
    setEditId(null);
    setErrors({});
  }

  async function handleDelete() {
    if (!editId) return;
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    const { error } = await supabase.from('inn_processos').delete().eq('id', editId);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    setProcessos(prev => prev.filter(p => p.id !== editId));
    setModal(false);
    setEditId(null);
    setForm(emptyForm);
  }

  // ============ CHECKLIST (no form) ============
  function addChecklistItem() {
    if (!novoChecklistItem.trim()) return;
    setForm(f => ({
      ...f,
      checklist: [...(f.checklist || []), { id: genId(), texto: novoChecklistItem.trim(), concluido: false }]
    }));
    setNovoChecklistItem('');
  }
  function toggleChecklistItem(id) {
    setForm(f => ({
      ...f,
      checklist: (f.checklist || []).map(i => i.id === id ? { ...i, concluido: !i.concluido } : i)
    }));
  }
  function removeChecklistItem(id) {
    setForm(f => ({ ...f, checklist: (f.checklist || []).filter(i => i.id !== id) }));
  }

  // ============ DRAG & DROP ============
  const onDragStart = (e, id) => { setDragging(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
  };
  const onDragLeave = () => setDragOverCol(null);
  async function onDrop(e, colId) {
    e.preventDefault();
    setDragOverCol(null);
    if (dragging === null) return;
    const proc = processos.find(p => p.id === dragging);
    setDragging(null);
    if (!proc || proc.status === colId) return;

    setProcessos(prev => prev.map(p => p.id === proc.id ? { ...p, status: colId } : p));
    const { error } = await supabase.from('inn_processos').update({ status: colId }).eq('id', proc.id);
    if (error) { console.error(error); alert('Erro ao mover: ' + error.message); }
  }

  // ============ RENDER CARD ============
  function renderCard(card) {
    const checklist = Array.isArray(card.checklist) ? card.checklist : [];
    const total = checklist.length;
    const feitos = checklist.filter(i => i.concluido).length;
    const progresso = total === 0 ? 0 : Math.round((feitos / total) * 100);

    return (
      <div
        key={card.id}
        className="card hoverable"
        draggable
        onDragStart={e => onDragStart(e, card.id)}
        onClick={() => openModal(card)}
        style={{
          padding: '14px 16px', cursor: 'pointer',
          opacity: dragging === card.id ? 0.5 : 1, userSelect: 'none',
          borderLeft: `3px solid ${PRIO_COLORS[card.prioridade] || 'var(--border)'}`,
          position: 'relative'
        }}
      >
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
            {card.categoria}
          </span>
        </div>

        <div style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
          {card.titulo}
        </div>

        {total > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-2)' }}>{feitos}/{total} subtarefas</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: progresso === 100 ? 'var(--primary)' : 'var(--text-2)' }}>{progresso}%</span>
            </div>
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${progresso}%`, height: '100%', background: progresso === 100 ? 'var(--primary)' : '#A78BFA', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <ResponsavelAvatar nome={card.responsavel} />
            <PrazoTag prazo={card.prazo} />
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: PRIO_COLORS[card.prioridade], padding: '2px 8px', borderRadius: 99, background: `${PRIO_COLORS[card.prioridade]}20` }}>
            {card.prioridade}
          </span>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>Carregando processos...</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={20} color="var(--primary)" />
            <h1 className="page-title" style={{ margin: 0 }}>Processos Internos</h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>Tarefas operacionais e administrativas da Innohvasion</p>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700 }}>A Fazer</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 2 }}>{totalAFazer}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700 }}>Em Andamento</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FBBF24', marginTop: 2 }}>{totalEmAndamento}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700 }}>Vencendo na Semana</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: vencendoSemana > 0 ? '#EF4444' : 'var(--text-1)', marginTop: 2 }}>{vencendoSemana}</div>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24, padding: 16, alignItems: 'center', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)'
      }}>
        <Filter size={14} color="var(--text-2)" />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600 }}>Filtros:</span>
        <select className="form-select" style={{ width: 'auto', minWidth: 140, padding: '6px 12px', height: 'auto' }}
          value={respFilter} onChange={e => setRespFilter(e.target.value)}>
          <option value="Todos">Todos os responsáveis</option>
          {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 140, padding: '6px 12px', height: 'auto' }}
          value={prioFilter} onChange={e => setPrioFilter(e.target.value)}>
          <option value="Todas">Todas prioridades</option>
          {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 140, padding: '6px 12px', height: 'auto' }}
          value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="Todas">Todas categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginLeft: 'auto' }}>
          {filtered.length} tarefa(s)
        </span>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {COLUMNS.map(col => {
          const cards = filtered.filter(p => p.status === col.id);
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
                      Nenhuma tarefa aqui
                    </div>
                  ) : cards.map(renderCard)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de criar/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Editar Tarefa' : 'Nova Tarefa'}</span>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className={`form-input${errors.titulo ? ' error' : ''}`} placeholder="Ex: Renovar contrato com fornecedor X"
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
                {errors.titulo && <span className="form-error">{errors.titulo}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <select className="form-select" value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                    {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <select className="form-select" value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}>
                    <option value="">— Sem responsável —</option>
                    {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo</label>
                  <input className="form-input" type="date" value={form.prazo}
                    onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-textarea" placeholder="Contexto, links, referências..."
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" style={{ minHeight: 60 }} placeholder="Notas adicionais..."
                  value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>

              {/* Checklist interno */}
              <div className="form-group">
                <label className="form-label">Checklist interno</label>
                {(form.checklist || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {form.checklist.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                        borderRadius: 6, border: '1px solid var(--border)'
                      }}>
                        <div onClick={() => toggleChecklistItem(item.id)} style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: `1px solid ${item.concluido ? 'var(--primary)' : 'var(--border)'}`,
                          background: item.concluido ? 'var(--primary)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', flexShrink: 0
                        }}>
                          {item.concluido && <Check size={11} color="#000" />}
                        </div>
                        <div style={{
                          flex: 1, fontSize: '0.85rem',
                          textDecoration: item.concluido ? 'line-through' : 'none',
                          color: item.concluido ? 'var(--text-2)' : 'var(--text-1)'
                        }}>{item.texto}</div>
                        <button type="button" className="btn btn-ghost" style={{ padding: 4, color: '#EF4444' }}
                          onClick={() => removeChecklistItem(item.id)} title="Remover"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="Adicionar item ao checklist..."
                    value={novoChecklistItem} onChange={e => setNovoChecklistItem(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }} />
                  <button type="button" className="btn btn-primary" onClick={addChecklistItem}>
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {editId && (
                <button className="btn btn-ghost" style={{ color: '#EF4444', marginRight: 'auto' }} onClick={handleDelete}>
                  <Trash2 size={14} /> Excluir
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Check size={16} /> {editId ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
