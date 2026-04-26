import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Save, X, MessageSquare, Calendar, DollarSign, Check, Trash2 } from 'lucide-react';
import { STATUS_CONFIG } from './data';
import { supabase } from './lib/supabase';

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Ideia'] || {};
  return <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>{cfg.label || status}</span>;
}

const emptyClientForm = {
  nome: '', segmento: '', contato: '', whatsapp: '', email: '',
  observacoes: '', status: 'Lead'
};

export default function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [automacoes, setAutomacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [newNota, setNewNota] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyClientForm);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: clis }, { data: auts }] = await Promise.all([
      supabase.from('inn_clientes').select('*').order('nome'),
      supabase.from('inn_automacoes').select('*')
    ]);
    setClientes(clis || []);
    setAutomacoes(auts || []);
    setLoading(false);
  }

  const clienteAutos = (id) => automacoes.filter(a => a.cliente_id === id);
  const mrr = (id) => automacoes.filter(a => a.cliente_id === id && a.status === 'Ativa').reduce((acc, a) => acc + (a.valor_mensal || 0), 0);
  const totalImpl = (id) => automacoes.filter(a => a.cliente_id === id).reduce((acc, a) => acc + (a.valor_impl || 0), 0);

  const openClient = (c) => {
    setSelected(c);
    setEditData({ ...c });
    setEditMode(false);
  };

  const saveEdit = async () => {
    const payload = {
      nome: editData.nome,
      segmento: editData.segmento,
      whatsapp: editData.whatsapp,
      contato: editData.contato,
      email: editData.email,
      observacoes: editData.observacoes,
      status: editData.status
    };
    
    const { error } = await supabase.from('inn_clientes').update(payload).eq('id', selected.id);
    if (error) {
      alert('Erro ao salvar. Pode ser que falte criar as colunas (status, contato, etc) no Supabase.\nErro: ' + error.message);
      return;
    }
    
    setClientes(prev => prev.map(c => c.id === selected.id ? { ...c, ...editData } : c));
    setSelected({ ...selected, ...editData });
    setEditMode(false);
  };

  const deleteClient = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente? Todas as automações vinculadas a ele ficarão órfãs.')) return;
    const { error } = await supabase.from('inn_clientes').delete().eq('id', selected.id);
    if (error) {
      alert('Erro ao excluir cliente: ' + error.message);
      return;
    }
    setClientes(prev => prev.filter(c => c.id !== selected.id));
    setSelected(null);
  };

  const addNota = async () => {
    if (!newNota.trim()) return;
    const nota = {
      id: Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
      texto: newNota.trim(),
    };
    
    const notasAtuais = selected.notas || [];
    const novasNotas = [nota, ...notasAtuais];
    
    const { error } = await supabase.from('inn_clientes').update({ notas: novasNotas }).eq('id', selected.id);
    if (error) {
      alert('Erro ao salvar nota. Verifique se a coluna "notas" (JSONB) existe na tabela inn_clientes.\nErro: ' + error.message);
      return;
    }
    
    setClientes(prev => prev.map(c => c.id === selected.id ? { ...c, notas: novasNotas } : c));
    setSelected(prev => ({ ...prev, notas: novasNotas }));
    setNewNota('');
  };

  const handleSaveNewClient = async () => {
    if (!form.nome.trim()) return;
    const payload = {
      nome: form.nome,
      segmento: form.segmento,
      whatsapp: form.whatsapp,
      contato: form.contato,
      email: form.email,
      observacoes: form.observacoes,
      status: form.status,
      notas: []
    };
    
    const { data, error } = await supabase.from('inn_clientes').insert([payload]).select().single();
    if (error) {
      alert('Erro ao criar cliente! Faltam colunas no banco de dados (status, contato, email, observacoes, notas).\nErro: ' + error.message);
      return;
    }
    
    setClientes(prev => [data, ...prev]);
    setModal(false);
    setForm(emptyClientForm);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>Carregando dados...</div>;
  }

  // LISTA
  if (!selected) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">{clientes.length} clientes cadastrados</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(emptyClientForm); setModal(true); }}><Plus size={16} /> Novo Cliente</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {clientes.map(c => (
            <div key={c.id} className="card hoverable" style={{ padding: '22px 26px', cursor: 'pointer' }} onClick={() => openClient(c)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{c.nome}</span>
                    <Badge status={c.status} />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 10 }}>{c.segmento}</div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contato</div>
                      <div style={{ fontSize: '0.82rem', marginTop: 2, fontWeight: 600 }}>{c.contato}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MRR</div>
                      <div style={{ fontSize: '0.82rem', marginTop: 2, fontWeight: 700, color: 'var(--primary)' }}>
                        R$ {mrr(c.id).toLocaleString('pt-BR')}/mês
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Implementações</div>
                      <div style={{ fontSize: '0.82rem', marginTop: 2, fontWeight: 700, color: '#A78BFA' }}>
                        R$ {totalImpl(c.id).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automações</div>
                      <div style={{ fontSize: '0.82rem', marginTop: 2, fontWeight: 600 }}>{clienteAutos(c.id).length} solução(ões)</div>
                    </div>
                  </div>
                </div>
                <div style={{ color: 'var(--text-2)', fontSize: '1.2rem' }}>›</div>
              </div>
            </div>
          ))}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={() => setModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Novo Cliente</span>
                <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Empresa *</label>
                  <input className="form-input" placeholder="Ex: Acme Corp"
                    value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Segmento</label>
                    <input className="form-input" placeholder="Ex: Tecnologia, Varejo"
                      value={form.segmento} onChange={e => setForm(f => ({ ...f, segmento: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option>Ideia</option>
                      <option>Lead</option>
                      <option>Ativo</option>
                      <option>Churn</option>
                      <option>Pausado</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome do Contato</label>
                    <input className="form-input" placeholder="Ex: João Silva"
                      value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input className="form-input" placeholder="(11) 99999-9999"
                      value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-input" type="email" placeholder="contato@acme.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observações Iniciais</label>
                  <textarea className="form-textarea" placeholder="Como o cliente chegou? Quais as necessidades principais?"
                    value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveNewClient}><Check size={16} /> Salvar Cliente</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PERFIL
  const autos = clienteAutos(selected.id);
  const mrrVal = mrr(selected.id);
  const implVal = totalImpl(selected.id);

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => setSelected(null)}>
        <ArrowLeft size={15} /> Voltar aos clientes
      </button>

      {/* Header do perfil */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="page-title">{selected.nome}</h1>
            <Badge status={selected.status} />
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>{selected.segmento}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {editMode ? (
            <>
              <button className="btn btn-ghost" onClick={() => setEditMode(false)}><X size={15} />Cancelar</button>
              <button className="btn btn-primary" onClick={saveEdit}><Save size={15} />Salvar</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setEditMode(true)}><Edit2 size={15} />Editar</button>
              <button className="btn btn-ghost" style={{ color: '#EF4444' }} onClick={deleteClient}><Trash2 size={15} />Excluir</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Col principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Dados gerais */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 18 }}>Dados Gerais</div>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome da empresa</label>
                    <input className="form-input" value={editData.nome} onChange={e => setEditData(d => ({ ...d, nome: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Segmento</label>
                    <input className="form-input" value={editData.segmento} onChange={e => setEditData(d => ({ ...d, segmento: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contato</label>
                    <input className="form-input" value={editData.contato} onChange={e => setEditData(d => ({ ...d, contato: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input className="form-input" value={editData.whatsapp} onChange={e => setEditData(d => ({ ...d, whatsapp: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editData.status || 'Lead'} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
                    <option>Ideia</option>
                    <option>Lead</option>
                    <option>Ativo</option>
                    <option>Churn</option>
                    <option>Pausado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-input" value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-textarea" value={editData.observacoes} onChange={e => setEditData(d => ({ ...d, observacoes: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Contato', val: selected.contato },
                  { label: 'WhatsApp', val: selected.whatsapp },
                  { label: 'E-mail', val: selected.email },
                  { label: 'Início', val: selected.created_at ? new Date(selected.created_at).toLocaleDateString('pt-BR') : 'N/A' },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{val}</div>
                  </div>
                ))}
                {selected.observacoes && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Observações</div>
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-2)' }}>{selected.observacoes}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Automações vinculadas */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16 }}>
              Automações Vinculadas <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>({autos.length})</span>
            </div>
            {autos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {autos.map(a => {
                  const cfg = STATUS_CONFIG[a.status] || {};
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', background: 'rgba(255,255,255,0.02)',
                      borderRadius: 10, borderLeft: `3px solid ${cfg.color}`,
                    }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 2 }}>{a.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{a.categoria}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {a.valorMensal > 0 && (
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                            R$ {a.valorMensal}/mês
                          </div>
                        )}
                        <Badge status={a.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Nenhuma automação vinculada</div>
            )}
          </div>

          {/* Timeline de Notas */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16 }}>
              <MessageSquare size={15} style={{ display: 'inline', marginRight: 6 }} />
              Notas & Interações
            </div>

            {/* Nova nota */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <textarea
                className="form-textarea"
                style={{ minHeight: 60, flex: 1 }}
                placeholder="Registrar observação, reunião ou próximo passo..."
                value={newNota}
                onChange={e => setNewNota(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={addNota} style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selected.notas?.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 10, borderLeft: '2px solid var(--border-active)',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, marginBottom: 6 }}>{n.data}</div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.55 }}>{n.texto}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Bloco Financeiro */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16 }}>
              <DollarSign size={15} style={{ display: 'inline', marginRight: 6 }} />
              Financeiro
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '14px 16px', background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.15)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>MRR Atual</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>R$ {mrrVal.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>por mês</div>
              </div>
              <div style={{ padding: '14px 16px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Total Implementações</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#A78BFA' }}>R$ {implVal.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>{autos.length} projeto(s)</div>
              </div>
              <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Acumulado Total</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>R$ {(implVal + mrrVal).toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>impl. + mês atual</div>
              </div>
            </div>
          </div>

          {/* Contato rápido */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 14 }}>Contato Rápido</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.85rem' }}><span style={{ color: 'var(--text-2)' }}>📱 </span>{selected.whatsapp}</div>
              <div style={{ fontSize: '0.85rem' }}><span style={{ color: 'var(--text-2)' }}>✉ </span>{selected.email}</div>
              <div style={{ fontSize: '0.85rem' }}><span style={{ color: 'var(--text-2)' }}>👤 </span>{selected.contato}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
