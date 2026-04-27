import React, { useState } from 'react';
import { ArrowLeft, Plus, X, ArrowUp, ArrowDown, Check, Edit2, Save, Trash2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { RESPONSAVEIS, ResponsavelAvatar } from './BacklogKanban';

const DOD_DEFAULT_ITEMS = ['Código revisado', 'Testado em produção', 'Documentado', 'Aprovado pelo responsável'];

function Badge({ status, type }) {
  let bg = '#333';
  let color = '#fff';

  if (type === 'prioridade') {
    if (status === 'Alta') { bg = '#EF444430'; color = '#EF4444'; }
    else if (status === 'Média') { bg = '#FBBF2430'; color = '#FBBF24'; }
    else if (status === 'Baixa') { bg = '#3B82F630'; color = '#3B82F6'; }
  } else {
    // defaults for kanban column
    if (status === 'Backlog') { bg = '#6B728030'; color = '#9CA3AF'; }
    else if (status === 'Em Análise') { bg = '#FBBF2430'; color = '#FBBF24'; }
    else if (status === 'Aprovada') { bg = '#10B98130'; color = '#34D399'; }
    else { bg = 'var(--primary-dim)'; color = 'var(--primary)'; }
  }

  return (
    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: bg, color: color, border: `1px solid ${color}30` }}>
      {status}
    </span>
  );
}

function StackTag({ tag, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
      {tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)} style={{ color: 'var(--primary)', lineHeight: 0 }}><X size={11} /></button>
      )}
    </span>
  );
}

export default function IdeiaDetalheView({ ideia, onBack }) {
  const [activeTab, setActiveTab] = useState('Planejamento');
  const [historico, setHistorico] = useState([]);

  const addLog = (mensagem) => {
    setHistorico(prev => {
      const newLog = { id: Date.now(), msg: mensagem, data: new Date().toLocaleString('pt-BR') };
      return [newLog, ...prev].slice(0, 10);
    });
  };

  // [A] Visão Geral
  const defaultExtraInfo = {
    problema: 'Nenhum problema definido ainda.',
    solucao: 'Nenhuma solução definida.',
    publico: 'Não definido.',
    diferencial: 'Não definido.'
  };
  const [extraInfo, setExtraInfo] = useState({ ...defaultExtraInfo, ...(ideia.extra_info || {}) });
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const handleEditClick = (field, currentVal) => {
    setEditingField(field);
    setTempValue(currentVal);
  };

  async function handleSaveEdit(field) {
    const merged = { ...extraInfo, [field]: tempValue };
    setExtraInfo(merged);
    const { error } = await supabase.from('inn_ideias').update({ extra_info: merged }).eq('id', ideia.id);
    if (error) {
      console.error(error);
      alert("Erro ao salvar. Tente novamente.");
      return;
    }
    setEditingField(null);
    addLog(`Visão Geral: ${field} atualizado`);
  }

  // [B] Critérios de Sucesso
  const [criterios, setCriterios] = useState(ideia.criterios || []);
  const [criterioForm, setCriterioForm] = useState({ texto: '', metrica: '' });
  const [showCriterioForm, setShowCriterioForm] = useState(false);

  const handleAddCriterio = () => {
    if (!criterioForm.texto) return;
    setCriterios([...criterios, { ...criterioForm, id: Date.now() }]);
    setCriterioForm({ texto: '', metrica: '' });
    setShowCriterioForm(false);
    addLog('Critério de sucesso adicionado');
  };

  const removeCriterio = (id) => {
    setCriterios(criterios.filter(c => c.id !== id));
    addLog('Critério de sucesso removido');
  };

  // [C] Estimativas
  const [estimativas, setEstimativas] = useState({
    esforco: ideia.esforco || '1-2 dias',
    valor: ideia.valor || 'Médio',
    complexidade: ideia.complexidade || 'Moderada'
  });

  const handleEstimativaChange = (field, val) => {
    setEstimativas(prev => ({ ...prev, [field]: val }));
    addLog(`Estimativas: ${field} alterado para ${val}`);
  };

  const calcScore = () => {
    const valMap = { 'Baixo': 1, 'Médio': 2, 'Alto': 3, 'Muito Alto': 4 };
    const compMap = { 'Simples': 1, 'Moderada': 2, 'Complexa': 3, 'Muito Complexa': 4 };
    
    const v = valMap[estimativas.valor] || 2;
    const c = compMap[estimativas.complexidade] || 2;
    
    // Calcula score 1 a 10
    let score = (v / c) * 3.33; 
    if (score > 10) score = 10;
    if (score < 1) score = 1;
    return score.toFixed(1);
  };

  const scoreValue = parseFloat(calcScore());
  const scoreColor = scoreValue >= 7 ? '#10B981' : scoreValue >= 4 ? '#FBBF24' : '#EF4444';

  // [D] Recursos
  const [stack, setStack] = useState(ideia.stack || []);
  const [stackInput, setStackInput] = useState('');
  const [habilidades, setHabilidades] = useState(ideia.habilidades || []);
  const [habilidadeInput, setHabilidadeInput] = useState('');
  const [integracoes, setIntegracoes] = useState(ideia.integracoes || []);
  const [integracaoInput, setIntegracaoInput] = useState('');

  const addListResource = (type, list, setList, input, setInput) => {
    if (!input.trim() || list.includes(input.trim())) return;
    setList([...list, input.trim()]);
    setInput('');
    addLog(`Recurso (${type}) adicionado: ${input}`);
  };

  const removeListResource = (type, list, setList, item) => {
    setList(list.filter(i => i !== item));
    addLog(`Recurso (${type}) removido`);
  };

  // [Plano de Ação] – 5 blocos
  // [A] Descrição detalhada → extra_info.descricao_detalhada
  const [descDetalhada, setDescDetalhada] = useState(extraInfo.descricao_detalhada || '');

  // [B] Critérios de Aceite → inn_ideia_passos com tipo='criterio'
  const [criteriosAceite, setCriteriosAceite] = useState([]);
  const [novoCriterio, setNovoCriterio] = useState('');

  // [C] Subtarefas → inn_ideia_passos com tipo='subtarefa'
  const [subtarefas, setSubtarefas] = useState([]);
  const [subtarefaForm, setSubtarefaForm] = useState({ titulo: '', responsavel: '', prazo: '' });
  const [showSubtarefaForm, setShowSubtarefaForm] = useState(false);

  // [D] Dependências → extra_info.dependencias
  const [dependencias, setDependencias] = useState(extraInfo.dependencias || '');

  // [E] Definition of Done → extra_info.definition_of_done (objeto { 'item': bool })
  const [dod, setDod] = useState(extraInfo.definition_of_done || {});

  React.useEffect(() => {
    supabase.from('inn_ideia_passos').select('*').eq('ideia_id', ideia.id).order('ordem').then(({ data, error }) => {
      if (error) { console.error('Erro ao carregar passos:', error); return; }
      const all = data || [];
      setCriteriosAceite(all.filter(p => p.tipo === 'criterio'));
      setSubtarefas(all.filter(p => p.tipo === 'subtarefa' || !p.tipo));
    });
  }, [ideia.id]);

  // Helper: persiste uma chave em extra_info
  async function patchExtraInfo(field, value) {
    const merged = { ...extraInfo, [field]: value };
    setExtraInfo(merged);
    const { error } = await supabase.from('inn_ideias').update({ extra_info: merged }).eq('id', ideia.id);
    if (error) { console.error(error); alert('Erro ao salvar: ' + error.message); }
  }

  // [B] handlers Critérios de Aceite
  async function addCriterio() {
    if (!novoCriterio.trim()) return;
    const payload = {
      ideia_id: ideia.id, tipo: 'criterio',
      titulo: novoCriterio.trim(), concluido: false,
      ordem: criteriosAceite.length
    };
    const { data, error } = await supabase.from('inn_ideia_passos').insert([payload]).select().single();
    if (error) { console.error(error); alert('Erro ao salvar critério: ' + error.message); return; }
    setCriteriosAceite(prev => [...prev, data]);
    setNovoCriterio('');
    addLog('Critério de aceite adicionado');
  }

  async function toggleCriterio(id) {
    const atual = criteriosAceite.find(c => c.id === id)?.concluido;
    setCriteriosAceite(prev => prev.map(c => c.id === id ? { ...c, concluido: !atual } : c));
    const { error } = await supabase.from('inn_ideia_passos').update({ concluido: !atual }).eq('id', id);
    if (error) { console.error(error); alert('Erro ao atualizar: ' + error.message); return; }
    addLog('Critério de aceite atualizado');
  }

  async function deleteCriterio(id) {
    setCriteriosAceite(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('inn_ideia_passos').delete().eq('id', id);
    if (error) { console.error(error); alert('Erro ao excluir: ' + error.message); return; }
    addLog('Critério de aceite removido');
  }

  // [C] handlers Subtarefas
  async function addSubtarefa() {
    if (!subtarefaForm.titulo.trim()) return;
    const payload = {
      ideia_id: ideia.id, tipo: 'subtarefa',
      titulo: subtarefaForm.titulo.trim(),
      responsavel: subtarefaForm.responsavel || null,
      prazo: subtarefaForm.prazo || null,
      concluido: false,
      ordem: subtarefas.length
    };
    const { data, error } = await supabase.from('inn_ideia_passos').insert([payload]).select().single();
    if (error) { console.error(error); alert('Erro ao salvar subtarefa: ' + error.message); return; }
    setSubtarefas(prev => [...prev, data]);
    setSubtarefaForm({ titulo: '', responsavel: '', prazo: '' });
    setShowSubtarefaForm(false);
    addLog('Subtarefa adicionada');
  }

  async function toggleSubtarefa(id) {
    const atual = subtarefas.find(s => s.id === id)?.concluido;
    setSubtarefas(prev => prev.map(s => s.id === id ? { ...s, concluido: !atual } : s));
    const { error } = await supabase.from('inn_ideia_passos').update({ concluido: !atual }).eq('id', id);
    if (error) { console.error(error); alert('Erro ao atualizar: ' + error.message); return; }
    addLog('Subtarefa atualizada');
  }

  async function deleteSubtarefa(id) {
    setSubtarefas(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('inn_ideia_passos').delete().eq('id', id);
    if (error) { console.error(error); alert('Erro ao excluir: ' + error.message); return; }
    addLog('Subtarefa removida');
  }

  function moveSubtarefa(index, dir) {
    const newList = [...subtarefas];
    const target = index + dir;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setSubtarefas(newList);
    addLog('Ordem das subtarefas alterada');
  }

  // [E] handler Definition of Done
  async function toggleDoD(item) {
    const next = { ...dod, [item]: !dod[item] };
    setDod(next);
    await patchExtraInfo('definition_of_done', next);
    addLog(`Definition of Done: ${item}`);
  }

  const subtarefasConcluidas = subtarefas.filter(s => s.concluido).length;
  const subtarefasProgresso = subtarefas.length === 0 ? 0 : Math.round((subtarefasConcluidas / subtarefas.length) * 100);

  // [F] Riscos
  const [riscos, setRiscos] = useState([]);
  const [riscoForm, setRiscoForm] = useState({ risco: '', probabilidade: 'Média', mitigacao: '' });
  const [showRiscoForm, setShowRiscoForm] = useState(false);

  React.useEffect(() => {
    supabase.from('inn_ideia_riscos').select('*').eq('ideia_id', ideia.id).order('created_at').then(({ data }) => setRiscos(data || []));
  }, [ideia.id]);

  async function handleAddRisco() {
    if (!riscoForm.risco) return;
    const payload = { ...riscoForm, ideia_id: ideia.id };
    const { data, error } = await supabase.from('inn_ideia_riscos').insert([payload]).select().single();
    if (error) {
      console.error(error);
      alert("Erro ao salvar. Tente novamente.");
      return;
    }
    if (data) setRiscos(prev => [...prev, data]);
    setRiscoForm({ risco: '', probabilidade: 'Média', mitigacao: '' });
    setShowRiscoForm(false);
    addLog('Risco mapeado adicionado');
  }

  // [G] Próximos Passos
  const [proxPassos, setProxPassos] = useState(ideia.prox_passos || '');

  async function saveProxPassos(texto) {
    setProxPassos(texto);
    const { error } = await supabase.from('inn_ideias').update({ prox_passos: texto }).eq('id', ideia.id);
    if (error) {
      console.error(error);
      alert("Erro ao salvar. Tente novamente.");
      return;
    }
    addLog('Próximos passos atualizados');
  }

  const renderEditableField = (field, label, isTextarea = false) => {
    const isEditing = editingField === field;
    const value = extraInfo[field];

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isTextarea ? (
              <textarea className="form-textarea" style={{ minHeight: 80, fontSize: '0.85rem' }} value={tempValue} onChange={e => setTempValue(e.target.value)} />
            ) : (
              <input className="form-input" style={{ fontSize: '0.85rem' }} value={tempValue} onChange={e => setTempValue(e.target.value)} />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => handleSaveEdit(field)}>Salvar</button>
              <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => setEditingField(null)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div 
            style={{ fontSize: '0.85rem', color: 'var(--text-1)', lineHeight: 1.5, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid transparent', cursor: 'pointer' }}
            onClick={() => handleEditClick(field, value)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            title="Clique para editar"
          >
            {value}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{ideia.titulo}</h1>
            <Badge status={ideia.coluna || 'Backlog'} />
            <Badge status={ideia.prioridade || 'Média'} type="prioridade" />
          </div>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 4 }}>
            Ideia / Solicitação {ideia.inn_automacoes ? ` · Vinculada a: ${ideia.inn_automacoes.nome}` : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {['Planejamento', 'Execução'].map(tab => (
          <button 
            key={tab}
            style={{ 
              background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-2)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent'
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'Planejamento' && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          
          {/* Coluna Esquerda Planejamento */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* [A] VISÃO GERAL */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Visão Geral</h3>
              {renderEditableField('problema', 'Problema que resolve', true)}
              {renderEditableField('solucao', 'Solução proposta', true)}
              {renderEditableField('publico', 'Público-alvo', false)}
              {renderEditableField('diferencial', 'Diferencial / Por que agora?', true)}
            </div>

            {/* [B] CRITÉRIOS DE SUCESSO */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Critérios de Sucesso</h3>
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowCriterioForm(!showCriterioForm)}>
                  <Plus size={14} /> Adicionar
                </button>
              </div>

              {showCriterioForm && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <input className="form-input" placeholder="O que vamos medir?" value={criterioForm.texto} onChange={e => setCriterioForm({...criterioForm, texto: e.target.value})} />
                  <input className="form-input" placeholder="Métrica (ex: +20% vendas)" value={criterioForm.metrica} onChange={e => setCriterioForm({...criterioForm, metrica: e.target.value})} />
                  <button className="btn btn-primary" onClick={handleAddCriterio}>Salvar</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {criterios.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', padding: '10px 0' }}>Nenhum critério definido.</div>
                ) : (
                  criterios.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.texto}</div>
                        {c.metrica && <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>Alvo: {c.metrica}</div>}
                      </div>
                      <button className="btn btn-ghost" style={{ padding: 6, color: '#EF4444' }} onClick={() => removeCriterio(c.id)}><X size={14} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita Planejamento */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* [C] ESTIMATIVAS */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Estimativas & Score</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Esforço Estimado</label>
                  <select className="form-select" value={estimativas.esforco} onChange={e => handleEstimativaChange('esforco', e.target.value)}>
                    <option>1-2 dias</option>
                    <option>1 semana</option>
                    <option>2-4 semanas</option>
                    <option>1-3 meses</option>
                    <option>+3 meses</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Valor Potencial</label>
                  <select className="form-select" value={estimativas.valor} onChange={e => handleEstimativaChange('valor', e.target.value)}>
                    <option>Baixo</option>
                    <option>Médio</option>
                    <option>Alto</option>
                    <option>Muito Alto</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Complexidade</label>
                  <select className="form-select" value={estimativas.complexidade} onChange={e => handleEstimativaChange('complexidade', e.target.value)}>
                    <option>Simples</option>
                    <option>Moderada</option>
                    <option>Complexa</option>
                    <option>Muito Complexa</option>
                  </select>
                </div>
                
                <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>Score de Prioridade</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: scoreColor }}>{scoreValue} <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 500 }}>/ 10</span></div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${(scoreValue / 10) * 100}%`, height: '100%', background: scoreColor }} />
                  </div>
                </div>
              </div>
            </div>

            {/* [D] RECURSOS NECESSÁRIOS */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Recursos Necessários</h3>
              
              <div style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Ferramentas / Stack</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} placeholder="Ex: Typebot..." value={stackInput} onChange={e => setStackInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addListResource('Stack', stack, setStack, stackInput, setStackInput)} />
                  <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => addListResource('Stack', stack, setStack, stackInput, setStackInput)}><Plus size={14} /></button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {stack.map(s => <StackTag key={s} tag={s} onRemove={() => removeListResource('Stack', stack, setStack, s)} />)}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Habilidades Necessárias</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} placeholder="Ex: Design UI..." value={habilidadeInput} onChange={e => setHabilidadeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addListResource('Habilidades', habilidades, setHabilidades, habilidadeInput, setHabilidadeInput)} />
                  <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => addListResource('Habilidades', habilidades, setHabilidades, habilidadeInput, setHabilidadeInput)}><Plus size={14} /></button>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  {habilidades.map(h => <li key={h} style={{ marginBottom: 4 }}>{h} <button onClick={() => removeListResource('Habilidades', habilidades, setHabilidades, h)} style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:'0.7rem' }}>[x]</button></li>)}
                </ul>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Integrações Externas</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} placeholder="Ex: API Asaas..." value={integracaoInput} onChange={e => setIntegracaoInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addListResource('Integrações', integracoes, setIntegracoes, integracaoInput, setIntegracaoInput)} />
                  <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => addListResource('Integrações', integracoes, setIntegracoes, integracaoInput, setIntegracaoInput)}><Plus size={14} /></button>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  {integracoes.map(i => <li key={i} style={{ marginBottom: 4 }}>{i} <button onClick={() => removeListResource('Integrações', integracoes, setIntegracoes, i)} style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:'0.7rem' }}>[x]</button></li>)}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'Execução' && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          
          {/* Coluna Esquerda Execução */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* ========= PLANO DE AÇÃO (5 blocos) ========= */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Plano de Ação</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 4 }}>Detalhamento completo da atividade</p>
              </div>

              {/* [A] Descrição detalhada */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  A · O que precisa ser feito exatamente?
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 150, fontSize: '0.88rem', lineHeight: 1.55 }}
                  placeholder="Descreva passo a passo, com contexto técnico e de negócio..."
                  value={descDetalhada}
                  onChange={e => setDescDetalhada(e.target.value)}
                  onBlur={() => {
                    if (descDetalhada !== (extraInfo.descricao_detalhada || '')) {
                      patchExtraInfo('descricao_detalhada', descDetalhada);
                      addLog('Descrição detalhada atualizada');
                    }
                  }}
                />
              </div>

              {/* [B] Critérios de Aceite */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  B · Critérios de Aceite
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {criteriosAceite.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', fontStyle: 'italic' }}>O que define que essa atividade está pronta?</div>
                  ) : criteriosAceite.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => toggleCriterio(c.id)}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${c.concluido ? 'var(--primary)' : 'var(--border)'}`, background: c.concluido ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {c.concluido && <Check size={12} color="#000" />}
                        </div>
                      </div>
                      <div style={{ flex: 1, fontSize: '0.88rem', textDecoration: c.concluido ? 'line-through' : 'none', color: c.concluido ? 'var(--text-2)' : 'var(--text-1)' }}>{c.titulo}</div>
                      <button className="btn btn-ghost" style={{ padding: 6, color: '#EF4444' }} onClick={() => deleteCriterio(c.id)} title="Remover"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="Ex: Endpoint retorna 200 com payload válido"
                    value={novoCriterio} onChange={e => setNovoCriterio(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCriterio()} />
                  <button className="btn btn-primary" onClick={addCriterio}><Plus size={14} /> Adicionar</button>
                </div>
              </div>

              {/* [C] Subtarefas */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    C · Subtarefas
                  </div>
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowSubtarefaForm(!showSubtarefaForm)}>
                    <Plus size={13} /> Nova subtarefa
                  </button>
                </div>

                {/* Barra de progresso */}
                {subtarefas.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{subtarefasConcluidas} de {subtarefas.length} concluídas</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>{subtarefasProgresso}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${subtarefasProgresso}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}

                {showSubtarefaForm && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, marginBottom: 12, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', alignItems: 'end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Título</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        value={subtarefaForm.titulo} onChange={e => setSubtarefaForm(f => ({ ...f, titulo: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Responsável</label>
                      <select className="form-select" style={{ padding: '6px 10px', fontSize: '0.8rem', minWidth: 120 }}
                        value={subtarefaForm.responsavel} onChange={e => setSubtarefaForm(f => ({ ...f, responsavel: e.target.value }))}>
                        <option value="">—</option>
                        {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Prazo</label>
                      <input className="form-input" type="date" style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        value={subtarefaForm.prazo} onChange={e => setSubtarefaForm(f => ({ ...f, prazo: e.target.value }))} />
                    </div>
                    <button className="btn btn-primary" style={{ height: 33 }} onClick={addSubtarefa}>Salvar</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {subtarefas.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', fontStyle: 'italic' }}>Nenhuma subtarefa ainda.</div>
                  ) : subtarefas.map((s, index) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 0 }} onClick={() => moveSubtarefa(index, -1)} disabled={index === 0}><ArrowUp size={13} /></button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 0 }} onClick={() => moveSubtarefa(index, 1)} disabled={index === subtarefas.length - 1}><ArrowDown size={13} /></button>
                      </div>

                      <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => toggleSubtarefa(s.id)}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${s.concluido ? 'var(--primary)' : 'var(--border)'}`, background: s.concluido ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {s.concluido && <Check size={12} color="#000" />}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, textDecoration: s.concluido ? 'line-through' : 'none', color: s.concluido ? 'var(--text-2)' : 'var(--text-1)' }}>{s.titulo}</div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.72rem', color: 'var(--text-2)', alignItems: 'center' }}>
                          {s.responsavel && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <ResponsavelAvatar nome={s.responsavel} size={16} />
                              {s.responsavel}
                            </span>
                          )}
                          {s.prazo && <span>Prazo: {new Date(s.prazo + 'T12:00').toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>

                      <button className="btn btn-ghost" style={{ padding: 6, color: '#EF4444' }} onClick={() => deleteSubtarefa(s.id)} title="Remover"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* [D] Dependências */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  D · Esta atividade depende de…
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 80, fontSize: '0.85rem', lineHeight: 1.5 }}
                  placeholder="Ex: aprovação do cliente, finalização da API X, contratação do dev Y..."
                  value={dependencias}
                  onChange={e => setDependencias(e.target.value)}
                  onBlur={() => {
                    if (dependencias !== (extraInfo.dependencias || '')) {
                      patchExtraInfo('dependencias', dependencias);
                      addLog('Dependências atualizadas');
                    }
                  }}
                />
              </div>

              {/* [E] Definition of Done */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  E · Definição de Pronto
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DOD_DEFAULT_ITEMS.map(item => {
                    const ok = !!dod[item];
                    return (
                      <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}>
                        <div onClick={() => toggleDoD(item)} style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${ok ? 'var(--primary)' : 'var(--border)'}`, background: ok ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {ok && <Check size={12} color="#000" />}
                        </div>
                        <span style={{ fontSize: '0.88rem', color: ok ? 'var(--text-2)' : 'var(--text-1)', textDecoration: ok ? 'line-through' : 'none' }}>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* [F] RISCOS E MITIGAÇÕES */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Riscos e Mitigações</h3>
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowRiscoForm(!showRiscoForm)}>
                  <Plus size={14} /> Adicionar
                </button>
              </div>

              {showRiscoForm && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr auto', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <input className="form-input" placeholder="Risco" value={riscoForm.risco} onChange={e => setRiscoForm({...riscoForm, risco: e.target.value})} />
                  <select className="form-select" value={riscoForm.probabilidade} onChange={e => setRiscoForm({...riscoForm, probabilidade: e.target.value})}>
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                  </select>
                  <input className="form-input" placeholder="Ação de mitigação" value={riscoForm.mitigacao} onChange={e => setRiscoForm({...riscoForm, mitigacao: e.target.value})} />
                  <button className="btn btn-primary" onClick={handleAddRisco}>Salvar</button>
                </div>
              )}

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Risco</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Prob.</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Mitigação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riscos.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: '16px 8px', color: 'var(--text-2)', textAlign: 'center' }}>Nenhum risco mapeado.</td></tr>
                    ) : (
                      riscos.map(r => {
                        const pColor = r.probabilidade === 'Alta' ? '#EF4444' : r.probabilidade === 'Média' ? '#FBBF24' : '#3B82F6';
                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 500 }}>{r.risco}</td>
                            <td style={{ padding: '12px 8px' }}><span style={{ color: pColor, fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', background: `${pColor}20`, borderRadius: 4 }}>{r.probabilidade}</span></td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-2)' }}>{r.mitigacao}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Coluna Direita Execução */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* [G] PRÓXIMOS PASSOS */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Próximos Passos (Geral)</h3>
                <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => saveProxPassos(proxPassos)} title="Salvar"><Save size={16} /></button>
              </div>
              <textarea 
                className="form-textarea" 
                style={{ minHeight: 150, fontSize: '0.85rem', lineHeight: 1.5 }} 
                placeholder="Ex: Aprovar orçamento com a diretoria..."
                value={proxPassos}
                onChange={e => setProxPassos(e.target.value)}
                onBlur={() => saveProxPassos(proxPassos)}
              />
            </div>

            {/* [H] HISTÓRICO DE ATUALIZAÇÕES */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', letterSpacing: '0.05em', marginBottom: 16 }}>Histórico de Atividade</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {historico.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Nenhuma atualização registrada.</div>
                ) : (
                  historico.map(h => (
                    <div key={h.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>{h.msg}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginTop: 2 }}>{h.data}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
