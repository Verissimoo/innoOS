import React, { useState } from 'react';
import { Plus, X, Edit2, Check, Bot, LayoutDashboard, Globe } from 'lucide-react';
import { STATUS_CONFIG } from './data';
import { supabase } from './lib/supabase';

const STATUS_OPTS = ['Todos', 'Ativa', 'Em Implantação', 'Portfólio', 'Ideia', 'Pausada'];

const BASE_STACK = ['n8n', 'WhatsApp API', 'GPT-4', 'Typebot', 'Google Sheets', 'Asaas', 'Meta Ads API', 'Node.js', 'Python', 'Supabase', 'Make', 'Zapier', 'Evolution API', 'Redis', 'PostgreSQL'];
const CATEGORIA_SUGGESTIONS = ['Atendimento', 'Prospecção', 'Financeiro', 'Operacional', 'Marketing', 'RH', 'Logística'];

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || {};
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label || status}
    </span>
  );
}

function StackTag({ tag }) {
  return <span className="tag">{tag}</span>;
}

const emptyForm = {
  nome: '', categoria: '', tipo: 'Agente de IA', status: 'Ideia',
  cliente: '', descricao: '', stack: [], stackInput: '',
  valorImpl: '', valorMensal: '', dataInicio: '', observacoes: '',
};

export default function AutomacoesView({ onSelectAutomacao }) {
  const [automacoes, setAutomacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [clienteFilter, setClienteFilter] = useState('Todos');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);

  React.useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: auts }, { data: clis }] = await Promise.all([
      supabase.from('inn_automacoes').select('*, inn_clientes(id, nome)').order('created_at', { ascending: false }),
      supabase.from('inn_clientes').select('*').order('nome'),
    ]);
    setAutomacoes(auts || []);
    setClientes(clis || []);
    setLoading(false);
  }

  const filtered = automacoes.filter(a => {
    const matchCat = catFilter === 'Todas' || a.categoria === catFilter;
    const matchSts = statusFilter === 'Todos' || a.status === statusFilter;
    const clienteNome = a.inn_clientes?.nome || 'Sem cliente';
    const matchCli = clienteFilter === 'Todos' ||
      (clienteFilter === 'Sem cliente' ? !a.cliente_id : clienteNome === clienteFilter);
    return matchCat && matchSts && matchCli;
  });

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.descricao.trim()) e.descricao = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleAddCliente(novoCliente) {
    const { data, error } = await supabase.from('inn_clientes').insert([novoCliente]).select().single();
    if (error) { console.error('Erro ao salvar cliente:', error); return null; }
    setClientes(prev => [...prev, data]);
    return data;
  }

  async function handleSave() {
    if (!validate()) return;
    
    let clienteId = form.cliente ? parseInt(form.cliente) : null;
    
    if (isAddingClient && form.newClienteName?.trim()) {
      const novoClienteObj = {
        nome: form.newClienteName.trim()
      };
      const novoCliSalvo = await handleAddCliente(novoClienteObj);
      if (novoCliSalvo) {
        clienteId = novoCliSalvo.id;
      }
    }

    const payload = {
      nome: form.nome,
      tipo: form.tipo || 'Automação',
      categoria: form.categoria,
      status: form.status,
      cliente_id: clienteId,
      descricao: form.descricao,
      stack: form.stack,
      valor_impl: parseFloat(form.valorImpl) || 0,
      valor_mensal: parseFloat(form.valorMensal) || 0,
      data_inicio: form.dataInicio || null,
      observacoes: form.observacoes,
    };
    
    const { data, error } = await supabase.from('inn_automacoes').insert([payload]).select('*, inn_clientes(id, nome)').single();
    if (error) { console.error('Erro ao salvar:', error); return; }
    
    setAutomacoes(prev => [data, ...prev]);
    setModal(false);
    setForm(emptyForm);
    setIsAddingClient(false);
    setErrors({});
  }

  const addStackTag = (tag) => {
    if (tag && !form.stack.includes(tag)) {
      setForm(f => ({ ...f, stack: [...f.stack, tag], stackInput: '' }));
    } else {
      setForm(f => ({ ...f, stackInput: '' }));
    }
  };

  const removeTag = (tag) => setForm(f => ({ ...f, stack: f.stack.filter(t => t !== tag) }));

  const handleSelect = (a) => {
    if (onSelectAutomacao) onSelectAutomacao(a);
    else console.log('Selecionado:', a);
  };

  const totalAtivas = automacoes.filter(a => a.status === 'Ativa').length;
  const totalMRR = automacoes.filter(a => a.status === 'Ativa').reduce((acc, curr) => acc + (curr.valor_mensal || 0), 0);
  const totalImplantacao = automacoes.filter(a => a.status === 'Em Implantação').length;

  const uniqueCats = ['Todas', ...Array.from(new Set(automacoes.map(a => a.categoria).filter(Boolean)))];
  const dynamicClienteOpts = ['Todos', ...clientes.map(c => c.nome), 'Sem cliente'];

  const allStacks = Array.from(new Set([...BASE_STACK, ...automacoes.flatMap(a => a.stack || [])]));
  const filteredStacks = allStacks.filter(s => !form.stack.includes(s) && s.toLowerCase().includes(form.stackInput.toLowerCase()));

  const handleStackKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStackTag(form.stackInput.trim());
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>Carregando dados...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Automações e Sistemas</h1>
          <p className="page-subtitle">Gerencie projetos ativos, portfólio e sistemas entregues</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal(true); }}>
          <Plus size={16} /> Nova Automação
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase' }}>Automações Ativas</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{totalAtivas}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid #A78BFA' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase' }}>MRR (Ativas)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: '#A78BFA' }}>R$ {totalMRR.toLocaleString('pt-BR')}</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '3px solid #FBBF24' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase' }}>Em Implantação</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{totalImplantacao}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600 }}>Filtros:</div>
        <select className="form-select" style={{ width: 'auto', minWidth: 150, padding: '6px 12px', height: 'auto' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {uniqueCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 150, padding: '6px 12px', height: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 150, padding: '6px 12px', height: 'auto' }} value={clienteFilter} onChange={e => setClienteFilter(e.target.value)}>
          {dynamicClienteOpts.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 16 }}>
        {filtered.length} automação{filtered.length !== 1 ? 'ões' : ''}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(a => {
          const cfg = STATUS_CONFIG[a.status] || {};
          const progresso = a.progresso !== undefined ? a.progresso : (a.status === 'Ativa' ? 100 : (a.status === 'Em Implantação' ? 40 : 0));
          
          return (
            <div key={a.id} className="card hoverable" onClick={() => handleSelect(a)} style={{ padding: 0, borderLeft: `3px solid ${cfg.color}`, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
              {/* Progress Bar */}
              <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', position: 'absolute', top: 0, left: 0 }}>
                <div style={{ width: `${progresso}%`, height: '100%', background: cfg.color, transition: 'width 0.3s' }} />
              </div>
              
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  {/* Left Column */}
                  <div style={{ flex: '1 1 400px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.tipo === 'Agente de IA' && <Bot size={16} color="#A78BFA" />}
                        {a.tipo === 'Sistema' && <LayoutDashboard size={16} color="#3B82F6" />}
                        {a.tipo === 'Web Site' && <Globe size={16} color="#10B981" />}
                        {a.nome}
                      </span>
                      <Badge status={a.status} />
                      <span className="tag">{a.categoria}</span>
                    </div>
                    <p style={{ 
                      fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {a.descricao}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.stack?.map(s => <StackTag key={s} tag={s} />)}
                    </div>
                  </div>

                  {/* Right Column (Metrics) */}
                  <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {a.cliente_id && (
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 2 }}>{a.inn_clientes?.nome || 'Sem cliente'}</div>
                      </div>
                    )}
                    {(a.valor_impl > 0 || a.valor_mensal > 0) && (
                      <div style={{ display: 'flex', gap: 16 }}>
                        {a.valor_impl > 0 && (
                          <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impl.</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 2, color: 'var(--primary)' }}>R$ {a.valor_impl.toLocaleString('pt-BR')}</div>
                          </div>
                        )}
                        {a.valor_mensal > 0 && (
                          <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensal</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 2, color: '#A78BFA' }}>R$ {a.valor_mensal.toLocaleString('pt-BR')}/mês</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
                    {a.data_inicio ? `Início: ${new Date(a.data_inicio + 'T12:00').toLocaleDateString('pt-BR')}` : 'Sem data de início'}
                  </div>
                  <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); handleSelect(a); }}>
                    Ver projeto →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nova Automação</span>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome da automação *</label>
                <input className={`form-input${errors.nome ? ' error' : ''}`} placeholder="Ex: IA de Atendimento WhatsApp"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                {errors.nome && <span className="form-error">{errors.nome}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <input className="form-input" placeholder="Ex: Atendimento, Financeiro, RH..."
                    value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {CATEGORIA_SUGGESTIONS.map(c => (
                      <button key={c} type="button" className="tag" 
                        style={{ cursor: 'pointer', background: form.categoria === c ? 'var(--primary-dim)' : undefined, color: form.categoria === c ? 'var(--primary)' : undefined }} 
                        onClick={() => setForm(f => ({ ...f, categoria: c }))}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTS.filter(s => s !== 'Todos').map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Entrega *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div 
                    onClick={() => setForm(f => ({ ...f, tipo: 'Agente de IA' }))}
                    style={{ padding: 12, borderRadius: 8, border: `1.5px solid ${form.tipo === 'Agente de IA' ? '#A78BFA' : 'var(--border)'}`, background: form.tipo === 'Agente de IA' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}><Bot size={16} color="#A78BFA" /> Agente de IA</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', lineHeight: 1.3 }}>WhatsApp, chatbot, atendimento automatizado</div>
                  </div>

                  <div 
                    onClick={() => setForm(f => ({ ...f, tipo: 'Sistema' }))}
                    style={{ padding: 12, borderRadius: 8, border: `1.5px solid ${form.tipo === 'Sistema' ? '#3B82F6' : 'var(--border)'}`, background: form.tipo === 'Sistema' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}><LayoutDashboard size={16} color="#3B82F6" /> Sistema / Dashboard</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', lineHeight: 1.3 }}>Plataforma, painel, site com lógica</div>
                  </div>

                  <div 
                    onClick={() => setForm(f => ({ ...f, tipo: 'Web Site' }))}
                    style={{ padding: 12, borderRadius: 8, border: `1.5px solid ${form.tipo === 'Web Site' ? '#10B981' : 'var(--border)'}`, background: form.tipo === 'Web Site' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}><Globe size={16} color="#10B981" /> Web Site</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', lineHeight: 1.3 }}>Landing pages, e-commerces, institucionais</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cliente</label>
                {!isAddingClient ? (
                  <select className="form-select" value={form.cliente}
                    onChange={e => {
                      if (e.target.value === 'NEW') {
                        setIsAddingClient(true);
                        setForm(f => ({ ...f, cliente: '' }));
                      } else {
                        setForm(f => ({ ...f, cliente: e.target.value }));
                      }
                    }}>
                    <option value="">Selecionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Cadastrar Novo Cliente</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Nome do novo cliente"
                      value={form.newClienteName || ''}
                      onChange={e => setForm(f => ({ ...f, newClienteName: e.target.value }))}
                      autoFocus
                    />
                    <button type="button" className="btn btn-ghost" onClick={() => { setIsAddingClient(false); setForm(f => ({ ...f, newClienteName: '' })); }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <textarea className={`form-textarea${errors.descricao ? ' error' : ''}`} placeholder="O que esta automação faz?"
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                {errors.descricao && <span className="form-error">{errors.descricao}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Stack / Ferramentas</label>
                <input 
                  className="form-input" 
                  placeholder="Digite uma ferramenta e pressione Enter..."
                  value={form.stackInput}
                  onChange={e => setForm(f => ({ ...f, stackInput: e.target.value }))}
                  onKeyDown={handleStackKeyDown}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.stack.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
                      {t} <button type="button" onClick={() => removeTag(t)} style={{ color: 'var(--primary)', lineHeight: 0 }}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                {filteredStacks.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 110, overflowY: 'auto' }}>
                    {filteredStacks.map(s => (
                      <button key={s} type="button" className="tag" style={{ cursor: 'pointer' }} onClick={() => addStackTag(s)}>{s}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valor Implementação (R$)</label>
                  <input className="form-input" type="number" placeholder="1000"
                    value={form.valorImpl} onChange={e => setForm(f => ({ ...f, valorImpl: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Recorrência Mensal (R$)</label>
                  <input className="form-input" type="number" placeholder="500"
                    value={form.valorMensal} onChange={e => setForm(f => ({ ...f, valorMensal: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data de Início</label>
                <input className="form-input" type="date"
                  value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" placeholder="Notas, próximos passos, contexto..."
                  value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}><Check size={16} /> Salvar Automação</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
