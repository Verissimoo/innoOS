import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import BacklogKanban from './BacklogKanban';

const TIPOS = ['Nova Automação', 'Melhoria', 'Novo Cliente Alvo', 'Processo Interno'];
const PRIORIDADE_COLORS = { Alta: '#EF4444', Média: '#FBBF24', Baixa: '#3B82F6' };

export default function BacklogView({ onSelectIdeia }) {
  const [ideias, setIdeias] = useState([]);
  const [automacoes, setAutomacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState('Todas');

  useEffect(() => { fetchAll(); }, []);

  function vincularAutomacao(ideia, automacoesList) {
    const aut = automacoesList.find(a => a.id === ideia.automacao_id);
    return { ...ideia, inn_automacoes: aut ? { id: aut.id, nome: aut.nome } : null };
  }

  async function fetchAll() {
    setLoading(true);
    try {
      const [{ data: idData, error: idErr }, { data: autData, error: autErr }] = await Promise.all([
        supabase.from('inn_ideias').select('*').order('created_at', { ascending: false }),
        supabase.from('inn_automacoes').select('id, nome').order('nome')
      ]);

      if (idErr) console.error('Erro ao buscar ideias:', idErr);
      if (autErr) console.error('Erro ao buscar automações:', autErr);

      const automacoesList = autData || [];
      setIdeias((idData || []).map(i => vincularAutomacao(i, automacoesList)));
      setAutomacoes(automacoesList);
    } catch (err) {
      console.error('Erro ao carregar backlog:', err);
    } finally {
      setLoading(false);
    }
  }

  // === Handlers passados ao BacklogKanban ===
  async function handleCreate(payload) {
    const { data, error } = await supabase.from('inn_ideias').insert([payload]).select().single();
    if (error) {
      console.error(error);
      alert('Erro ao salvar: ' + error.message);
      return false;
    }
    setIdeias(prev => [vincularAutomacao(data, automacoes), ...prev]);
    return true;
  }

  async function handleUpdate(id, payload) {
    const { data, error } = await supabase.from('inn_ideias').update(payload).eq('id', id).select().single();
    if (error) {
      console.error(error);
      alert('Erro ao editar: ' + error.message);
      return false;
    }
    setIdeias(prev => prev.map(i => i.id === id ? vincularAutomacao(data, automacoes) : i));
    return true;
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta ideia?')) return;
    const { error } = await supabase.from('inn_ideias').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    setIdeias(prev => prev.filter(i => i.id !== id));
  }

  async function handleMove(id, novoStatus) {
    setIdeias(prev => prev.map(i => i.id === id ? { ...i, status: novoStatus } : i));
    const { error } = await supabase.from('inn_ideias').update({ status: novoStatus }).eq('id', id);
    if (error) { console.error(error); alert('Erro ao mover: ' + error.message); }
  }

  const filteredIdeias = ideias.filter(i => {
    const matchTipo = tipoFilter === 'Todos' || i.tipo === tipoFilter;
    const matchPrio = prioridadeFilter === 'Todas' || i.prioridade === prioridadeFilter;
    return matchTipo && matchPrio;
  });

  const totalIdeias = ideias.length;
  const altaPrio = ideias.filter(i => i.prioridade === 'Alta').length;
  const desenvolvendo = ideias.filter(i => i.status === 'Desenvolvendo').length;

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

      <BacklogKanban
        ideias={filteredIdeias}
        automacoes={automacoes}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onMove={handleMove}
        onSelectIdeia={onSelectIdeia}
      />
    </div>
  );
}
