import React, { useState } from 'react';
import { ArrowLeft, Edit2, Archive, Check, Plus, Clock } from 'lucide-react';
import { STATUS_CONFIG } from './data';
import { supabase } from './lib/supabase';

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

export default function ProjetoDetalheView({ projeto, onBack }) {
  // Determine current phase
  let currentFase = 2; // Default for others
  if (projeto.status === 'Portfólio' || projeto.status === 'Ideia') currentFase = 1;
  else if (projeto.status === 'Em Implantação') currentFase = 4;
  else if (projeto.status === 'Ativa') currentFase = 5;

  // Kanban State
  const [tarefas, setTarefas] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ titulo: '', prioridade: 'Média', responsavel: '', horas: '' });
  
  // Notas State
  const [notas, setNotas] = useState([]);
  const [notaInput, setNotaInput] = useState('');

  // Checklist State
  const [checklist, setChecklist] = useState([]);
  
  const DEFAULT_CHECKLIST = [
    'Briefing documentado',
    'Proposta aprovada pelo cliente',
    'Ambiente de desenvolvimento configurado',
    'Testes realizados',
    'Treinamento do cliente feito',
    'Documentação entregue'
  ];

  // Drag state
  const [draggedTask, setDraggedTask] = useState(null);

  // Effects
  React.useEffect(() => {
    supabase.from('inn_tarefas').select('*').eq('automacao_id', projeto.id).order('ordem').then(({ data }) => setTarefas(data || []));
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

  // Handlers Kanban
  async function handleAddTask() {
    if (!taskForm.titulo) return;
    const payload = { ...taskForm, status: 'A fazer', automacao_id: projeto.id, ordem: tarefas.length };
    const { data, error } = await supabase.from('inn_tarefas').insert([payload]).select().single();
    if (error) {
      console.error(error);
      alert("Erro ao salvar. Tente novamente.");
      return;
    }
    if (data) setTarefas(prev => [...prev, data]);
    setTaskForm({ titulo: '', prioridade: 'Média', responsavel: '', horas: '' });
    setShowTaskForm(false);
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  async function updateTarefaStatus(id, novoStatus) {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: novoStatus } : t));
    const { error } = await supabase.from('inn_tarefas').update({ status: novoStatus }).eq('id', id);
    if (error) {
      console.error(error);
      alert("Erro ao salvar. Tente novamente.");
    }
  }

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      updateTarefaStatus(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

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

  // Metrics
  const tarefasConcluidas = tarefas.filter(t => t.status === 'Concluído').length;
  const totalTarefas = tarefas.length;
  const progressoTarefas = totalTarefas === 0 ? 0 : Math.round((tarefasConcluidas / totalTarefas) * 100);
  
  const diasDesdeInicio = projeto.data_inicio 
    ? Math.floor((new Date() - new Date(projeto.data_inicio + 'T12:00')) / (1000 * 60 * 60 * 24)) 
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{projeto.nome}</h1>
            <Badge status={projeto.status} />
          </div>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 4 }}>{projeto.categoria}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost"><Edit2 size={16} /> Editar</button>
          <button className="btn btn-ghost"><Archive size={16} /> Arquivar</button>
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
                  <div key={f.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, flex: 1 }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', background: bgColor, border: `2px solid ${borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color
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

          {/* [B] BACKLOG DE TAREFAS */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Backlog de Tarefas</h3>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus size={14} /> Adicionar tarefa
              </button>
            </div>

            {showTaskForm && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Título</label>
                    <input className="form-input" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={taskForm.titulo} onChange={e => setTaskForm({...taskForm, titulo: e.target.value})} placeholder="Nova tarefa..." />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Prioridade</label>
                    <select className="form-select" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={taskForm.prioridade} onChange={e => setTaskForm({...taskForm, prioridade: e.target.value})}>
                      <option>Baixa</option>
                      <option>Média</option>
                      <option>Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Responsável</label>
                    <input className="form-input" style={{ padding: '6px 10px', fontSize: '0.85rem', width: 70, textAlign: 'center' }} maxLength={2} value={taskForm.responsavel} onChange={e => setTaskForm({...taskForm, responsavel: e.target.value.toUpperCase()})} placeholder="Ex: FS" />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Horas</label>
                    <input className="form-input" type="number" style={{ padding: '6px 10px', fontSize: '0.85rem', width: 70 }} value={taskForm.horas} onChange={e => setTaskForm({...taskForm, horas: e.target.value})} placeholder="Ex: 2" />
                  </div>
                  <button className="btn btn-primary" style={{ padding: '6px 16px', height: 35 }} onClick={handleAddTask}>Salvar</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {['A fazer', 'Em andamento', 'Concluído'].map(colStatus => (
                <div 
                  key={colStatus} 
                  style={{ flex: 1, minWidth: 220, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 16, minHeight: 200 }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, colStatus)}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 16 }}>
                    {colStatus} ({tarefas.filter(t => t.status === colStatus).length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tarefas.filter(t => t.status === colStatus).map(task => {
                      const prioColor = task.prioridade === 'Alta' ? '#EF4444' : task.prioridade === 'Média' ? '#FBBF24' : '#3B82F6';
                      return (
                        <div 
                          key={task.id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, task)}
                          style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', cursor: 'grab' }}
                        >
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{task.titulo}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: prioColor }} title={`Prioridade ${task.prioridade}`} />
                              {task.horas && <span style={{ fontSize: '0.7rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {task.horas}h</span>}
                            </div>
                            {task.responsavel && (
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }} title={`Responsável: ${task.responsavel}`}>
                                {task.responsavel}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>{projeto.valor_impl ? `R$ ${projeto.valor_impl.toLocaleString('pt-BR')}` : '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 4 }}>Recorrência Mensal</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#A78BFA' }}>{projeto.valor_mensal ? `R$ ${projeto.valor_mensal.toLocaleString('pt-BR')}/mês` : '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 4 }}>Data de Início</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{projeto.data_inicio ? new Date(projeto.data_inicio + 'T12:00').toLocaleDateString('pt-BR') : '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: 8 }}>Stack & Ferramentas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {projeto.stack && projeto.stack.length > 0 ? projeto.stack.map(s => <StackTag key={s} tag={s} />) : <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Nenhuma informada</span>}
                </div>
              </div>
            </div>
          </div>

          {/* [E] MÉTRICAS RÁPIDAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalTarefas}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', marginTop: 4 }}>Total Tarefas</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{tarefasConcluidas}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', marginTop: 4 }}>Concluídas</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{progressoTarefas}%</div>
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
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => toggleCheck(item.id)}>
                  <div style={{ 
                    width: 18, height: 18, borderRadius: 4, border: `1px solid ${item.concluido ? 'var(--primary)' : 'var(--border)'}`, 
                    background: item.concluido ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 0.2s'
                  }}>
                    {item.concluido && <Check size={12} color="#000" />}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: item.concluido ? 'var(--text-2)' : 'var(--text-1)', textDecoration: item.concluido ? 'line-through' : 'none', lineHeight: 1.4, transition: 'all 0.2s' }}>
                    {item.item}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
