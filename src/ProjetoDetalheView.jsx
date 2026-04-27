import React, { useState } from 'react';
import { ArrowLeft, Edit2, Check, X, Save, Plus } from 'lucide-react';
import { STATUS_CONFIG } from './data';
import { supabase } from './lib/supabase';
import BacklogKanban from './BacklogKanban';

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || { bg: '#333', color: '#fff' };
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label || status}
    </span>
  );
}

function StackTag({ tag }) {
  return <span className="tag">{tag}</span>;
}

const FASES = [
  { id: 1, nome: 'Levantamento' },
  { id: 2, nome: 'Desenvolvimento' },
  { id: 3, nome: 'Testes' },
  { id: 4, nome: 'Implantação' },
  { id: 5, nome: 'Ativo' },
];

export default function ProjetoDetalheView({ projeto, onBack, onSelectIdeia, backLabel }) {
  const [localStatus, setLocalStatus] = useState(projeto.status);

  // Determine current phase
  let currentFase = 2; // Default for others
  if (localStatus === 'Portfólio' || localStatus === 'Ideia') currentFase = 1;
  else if (localStatus === 'Testes') currentFase = 3;
  else if (localStatus === 'Em Implantação') currentFase = 4;
  else if (localStatus === 'Ativa') currentFase = 5;

  const FASE_MAP = {
    1: 'Ideia',
    2: 'Desenvolvimento',
    3: 'Testes',
    4: 'Em Implantação',
    5: 'Ativa'
  };

  async function handleFaseClick(faseId) {
    const newStatus = FASE_MAP[faseId];
    setLocalStatus(newStatus);
    const { error } = await supabase.from('inn_automacoes').update({ status: newStatus }).eq('id', projeto.id);
    if (error) {
      alert("Erro ao atualizar etapa: " + error.message);
      setLocalStatus(projeto.status);
    }
  }

  // Backlog interno (inn_ideias filtrado por automacao_id)
  const [ideias, setIdeias] = useState([]);

  // Notas State
  const [notas, setNotas] = useState([]);
  const [notaInput, setNotaInput] = useState('');

  // Checklist State
  const [checklist, setChecklist] = useState([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  // Detalhes Editáveis
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: projeto.nome,
    categoria: projeto.categoria,
    valor_impl: projeto.valor_impl || 0,
    valor_mensal: projeto.valor_mensal || 0,
    stack: projeto.stack ? projeto.stack.join(', ') : ''
  });

  const DEFAULT_CHECKLIST = [
    'Briefing documentado',
    'Proposta aprovada pelo cliente',
    'Ambiente de desenvolvimento configurado',
    'Testes realizados',
    'Treinamento do cliente feito',
    'Documentação entregue'
  ];

  // Effects
  React.useEffect(() => {
    supabase.from('inn_ideias').select('*').eq('automacao_id', projeto.id).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Erro ao buscar ideias do projeto:', error);
        setIdeias(data || []);
      });
    supabase.from('inn_notas').select('*').eq('automacao_id', projeto.id).order('created_at', { ascending: false }).then(({ data }) => setNotas(data || []));

    supabase.from('inn_checklist').select('*').eq('automacao_id', projeto.id).order('ordem').then(async ({ data }) => {
      if (!data || data.length === 0) {
        const items = DEFAULT_CHECKLIST.map((item, i) => ({ automacao_id: projeto.id, item, concluido: false, ordem: i }));
        const { data: inserted } = await supabase.from('inn_checklist').insert(items).select();
        setChecklist(inserted || []);
      } else {
        setChecklist(data);
      }
    });
  }, [projeto.id]);

  // Handlers do BacklogKanban (operam sobre inn_ideias)
  async function handleIdeiaCreate(payload) {
    const { data, error } = await supabase.from('inn_ideias').insert([payload]).select().single();
    if (error) {
      console.error(error);
      alert('Erro ao criar item: ' + error.message);
      return false;
    }
    setIdeias(prev => [data, ...prev]);
    return true;
  }

  async function handleIdeiaUpdate(id, payload) {
    const { data, error } = await supabase.from('inn_ideias').update(payload).eq('id', id).select().single();
    if (error) {
      console.error(error);
      alert('Erro ao atualizar item: ' + error.message);
      return false;
    }
    setIdeias(prev => prev.map(i => i.id === id ? data : i));
    return true;
  }

  async function handleIdeiaDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;
    const { error } = await supabase.from('inn_ideias').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    setIdeias(prev => prev.filter(i => i.id !== id));
  }

  async function handleIdeiaMove(id, novoStatus) {
    setIdeias(prev => prev.map(i => i.id === id ? { ...i, status: novoStatus } : i));
    const { error } = await supabase.from('inn_ideias').update({ status: novoStatus }).eq('id', id);
    if (error) { console.error(error); alert('Erro ao mover: ' + error.message); }
  }

  // Handlers Notas
  async function handleAddNota() {
    if (!notaInput.trim()) return;
    const payload = { automacao_id: projeto.id, texto: notaInput };
    const { data, error } = await supabase.from('inn_notas').insert([payload]).select().single();
    if (error) {
      console.error(error);
      alert("Erro ao salvar. Tente novamente.");
      return;
    }
    if (data) setNotas(prev => [data, ...prev]);
    setNotaInput('');
  }

  // Handlers Checklist
  async function toggleCheck(id) {
    const atual = checklist.find(c => c.id === id)?.concluido;
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, concluido: !atual } : c));
    const { error } = await supabase.from('inn_checklist').update({ concluido: !atual }).eq('id', id);
    if (error) {
      console.error(error);
      alert("Erro ao salvar. Tente novamente.");
    }
  }

  async function handleAddCheck() {
    if (!newCheckItem.trim()) return;
    const payload = { automacao_id: projeto.id, item: newCheckItem.trim(), concluido: false, ordem: checklist.length };
    const { data, error } = await supabase.from('inn_checklist').insert([payload]).select().single();
    if (data && !error) setChecklist(prev => [...prev, data]);
    setNewCheckItem('');
  }

  async function handleDeleteCheck(e, id) {
    e.stopPropagation();
    setChecklist(prev => prev.filter(c => c.id !== id));
    await supabase.from('inn_checklist').delete().eq('id', id);
  }

  async function saveProjectDetails() {
    const stackArr = editForm.stack.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      nome: editForm.nome,
      categoria: editForm.categoria,
      valor_impl: Number(editForm.valor_impl),
      valor_mensal: Number(editForm.valor_mensal),
      stack: stackArr
    };
    
    const { error } = await supabase.from('inn_automacoes').update(payload).eq('id', projeto.id);
    if (!error) {
      Object.assign(projeto, payload); // Modifica prop para refletir na UI sem recarregar tudo
      setEditMode(false);
    } else {
      alert("Erro ao salvar informações: " + error.message);
    }
  }

  // Metrics — agora baseadas em inn_ideias (status = 'Pronto' equivale a concluído)
  const ideiasConcluidas = ideias.filter(i => i.status === 'Pronto').length;
  const totalIdeias = ideias.length;
  const progressoIdeias = totalIdeias === 0 ? 0 : Math.round((ideiasConcluidas / totalIdeias) * 100);

  const diasDesdeInicio = projeto.data_inicio
    ? Math.floor((new Date() - new Date(projeto.data_inicio + 'T12:00')) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} />
          <span style={{ fontSize: '0.82rem' }}>{backLabel || 'Voltar'}</span>
        </button>
        <div style={{ flex: 1 }}>
          {editMode ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" style={{ width: 250 }} value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} />
              <input className="form-input" style={{ width: 150 }} value={editForm.categoria} onChange={e => setEditForm({ ...editForm, categoria: e.target.value })} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 className="page-title" style={{ margin: 0 }}>{projeto.nome}</h1>
                <Badge status={localStatus} />
              </div>
              <p className="page-subtitle" style={{ margin: 0, marginTop: 4 }}>{projeto.categoria}</p>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {editMode ? (
            <>
              <button className="btn btn-ghost" onClick={() => setEditMode(false)}><X size={16} /> Cancelar</button>
              <button className="btn btn-primary" onClick={saveProjectDetails}><Save size={16} /> Salvar Alterações</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setEditMode(true)}><Edit2 size={16} /> Editar Informações</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Main Column */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* [A] ETAPAS DO PROJETO */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>Etapas do Projeto</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              {/* Connecting line */}
              <div style={{ position: 'absolute', top: 16, left: 30, right: 30, height: 2, background: 'var(--border)', zIndex: 0 }} />
              
              {FASES.map((f) => {
                const isCompleted = f.id < currentFase;
                const isCurrent = f.id === currentFase;
                
                let bgColor = 'var(--bg-card)';
                let borderColor = 'var(--border)';
                let color = 'var(--text-2)';
                
                if (isCompleted) {
                  bgColor = 'var(--primary)';
                  borderColor = 'var(--primary)';
                  color = '#000';
                } else if (isCurrent) {
                  bgColor = 'var(--primary-dim)';
                  borderColor = 'var(--primary)';
                  color = 'var(--primary)';
                }

                return (
                  <div key={f.id} 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, flex: 1, cursor: 'pointer' }}
                    onClick={() => handleFaseClick(f.id)}
                    title="Clique para alterar a etapa atual"
                  >
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', background: bgColor, border: `2px solid ${borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color,
                      transition: 'all 0.2s'
                    }}>
                      {isCompleted ? <Check size={16} /> : f.id}
                    </div>
                    <div style={{ marginTop: 12, fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-1)' : 'var(--text-2)', textAlign: 'center', maxWidth: 80 }}>
                      {f.nome}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* [B] BACKLOG INTERNO DO PROJETO */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Backlog do Projeto</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 4 }}>
                Itens criados aqui aparecem também no backlog geral. Status: Ideia → Analisando → Desenvolvendo → Pronto.
              </p>
            </div>
            <BacklogKanban
              ideias={ideias}
              automacoes={[]}
              automacaoFixa={projeto.id}
              onCreate={handleIdeiaCreate}
              onUpdate={handleIdeiaUpdate}
              onDelete={handleIdeiaDelete}
              onMove={handleIdeiaMove}
              onSelectIdeia={onSelectIdeia}
            />
          </div>

          {/* [C] ANOTAÇÕES / LOG DE ATIVIDADE */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Anotações e Log</h3>
            <div style={{ marginBottom: 24 }}>
              <textarea 
                className="form-textarea" 
                placeholder="Adicionar uma nova nota ou registro..." 
                style={{ minHeight: 80, marginBottom: 12, fontSize: '0.85rem' }}
                value={notaInput}
                onChange={e => setNotaInput(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={handleAddNota}>Salvar nota</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {notas.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.85rem', padding: '20px 0' }}>Nenhuma nota registrada.</div>
              ) : (
                notas.map(nota => (
                  <div key={nota.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '2px solid var(--border-active)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 6 }}>{new Date(nota.created_at).toLocaleString('pt-BR')}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-1)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{nota.texto}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* [D] INFORMAÇÕES DO PROJETO */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', letterSpacing: '0.05em', marginBottom: 16 }}>Informações</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 4 }}>Cliente</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{projeto.inn_clientes?.nome || 'Sem cliente'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 4 }}>Valor Implantação</div>
                {editMode ? (
                  <input type="number" className="form-input" value={editForm.valor_impl} onChange={e => setEditForm({...editForm, valor_impl: e.target.value})} style={{ padding: '4px 8px' }} />
                ) : (
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>{projeto.valor_impl ? `R$ ${projeto.valor_impl.toLocaleString('pt-BR')}` : '-'}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 4 }}>Recorrência Mensal</div>
                {editMode ? (
                  <input type="number" className="form-input" value={editForm.valor_mensal} onChange={e => setEditForm({...editForm, valor_mensal: e.target.value})} style={{ padding: '4px 8px' }} />
                ) : (
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#A78BFA' }}>{projeto.valor_mensal ? `R$ ${projeto.valor_mensal.toLocaleString('pt-BR')}/mês` : '-'}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 4 }}>Data de Início</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{projeto.data_inicio ? new Date(projeto.data_inicio + 'T12:00').toLocaleDateString('pt-BR') : '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 8 }}>Stack & Ferramentas</div>
                {editMode ? (
                  <input className="form-input" placeholder="Separado por vírgulas..." value={editForm.stack} onChange={e => setEditForm({...editForm, stack: e.target.value})} style={{ padding: '4px 8px' }} />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {projeto.stack && projeto.stack.length > 0 ? projeto.stack.map(s => <StackTag key={s} tag={s} />) : <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Nenhuma informada</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* [E] MÉTRICAS RÁPIDAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalIdeias}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', marginTop: 4 }}>Total Itens</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{ideiasConcluidas}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', marginTop: 4 }}>Prontos</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{progressoIdeias}%</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', marginTop: 4 }}>Progresso</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{diasDesdeInicio > 0 ? diasDesdeInicio : 0}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', marginTop: 4 }}>Dias Ativo</div>
            </div>
          </div>

          {/* [F] CHECKLIST DE SAÚDE */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', letterSpacing: '0.05em', marginBottom: 16 }}>Checklist de Saúde</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {checklist.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <div onClick={() => toggleCheck(item.id)} style={{ 
                    width: 18, height: 18, borderRadius: 4, border: `1px solid ${item.concluido ? 'var(--primary)' : 'var(--border)'}`, 
                    background: item.concluido ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 0.2s'
                  }}>
                    {item.concluido && <Check size={12} color="#000" />}
                  </div>
                  <div style={{ flex: 1, fontSize: '0.85rem', color: item.concluido ? 'var(--text-2)' : 'var(--text-1)', textDecoration: item.concluido ? 'line-through' : 'none' }}>
                    {item.item}
                  </div>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: 4, color: '#EF4444' }} 
                    onClick={(e) => handleDeleteCheck(e, item.id)}
                    title="Excluir Item"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input 
                  className="form-input" 
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }} 
                  placeholder="Novo item do checklist..." 
                  value={newCheckItem} 
                  onChange={e => setNewCheckItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCheck()}
                />
                <button className="btn btn-primary" style={{ padding: '6px 16px' }} onClick={handleAddCheck}>
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
