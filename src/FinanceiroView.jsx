import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, X, Check, Edit2, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, AlertCircle, Calendar, Filter
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  FORMAS_PAGAMENTO, RECEBIMENTO_TIPOS, RECEBIMENTO_STATUS,
  GASTO_CATEGORIAS, GASTO_TIPOS, GASTO_RECORRENCIAS, GASTO_STATUS,
  STATUS_COLORS
} from './constants';

const fmtBRL = (n) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—';
const todayISO = () => new Date().toISOString().slice(0, 10);

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#94A3B8';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}20`, color, border: `1px solid ${color}40`, whiteSpace: 'nowrap'
    }}>
      {status}
    </span>
  );
}

function MetricCard({ title, value, accent, icon: Icon, sub }) {
  return (
    <div className="card" style={{ padding: 18, borderLeft: `3px solid ${accent}`, flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {Icon && <Icon size={16} color={accent} />}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: accent, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function FeedbackBanner({ feedback, onClose }) {
  if (!feedback) return null;
  const isError = feedback.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 1000,
      padding: '12px 16px', borderRadius: 8,
      background: isError ? '#EF444420' : '#00FFB220',
      border: `1px solid ${isError ? '#EF4444' : '#00FFB2'}`,
      color: isError ? '#EF4444' : '#00FFB2',
      fontSize: '0.85rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 380
    }}>
      {isError ? <AlertCircle size={16} /> : <Check size={16} />}
      <span style={{ flex: 1 }}>{feedback.msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
        <X size={14} />
      </button>
    </div>
  );
}

const emptyRecebimento = {
  descricao: '', tipo: 'Implantação', valor: '', parcelas: 1, parcela_atual: 1,
  forma_pagamento: 'PIX', status: 'Pendente', data_prevista: '', data_recebido: '',
  cliente_id: '', automacao_id: '', observacoes: '', comprovante_url: ''
};

const emptyGasto = {
  descricao: '', categoria: 'Operacional', tipo: 'Variável', recorrencia: 'Único',
  valor: '', forma_pagamento: 'PIX', status: 'Pendente', data_prevista: '',
  data_pago: '', automacao_id: '', observacoes: ''
};

export default function FinanceiroView() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const [recebimentos, setRecebimentos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [automacoes, setAutomacoes] = useState([]);

  // Filtros recebimentos
  const [recStatusFilter, setRecStatusFilter] = useState('Todos');
  const [recTipoFilter, setRecTipoFilter] = useState('Todos');

  // Filtros gastos
  const [gasTipoFilter, setGasTipoFilter] = useState('Todos');
  const [gasStatusFilter, setGasStatusFilter] = useState('Todos');
  const [gasCatFilter, setGasCatFilter] = useState('Todas');

  // Modais
  const [recModal, setRecModal] = useState(false);
  const [recForm, setRecForm] = useState(emptyRecebimento);
  const [recEditId, setRecEditId] = useState(null);

  const [gasModal, setGasModal] = useState(false);
  const [gasForm, setGasForm] = useState(emptyGasto);
  const [gasEditId, setGasEditId] = useState(null);

  // Mini-modal "marcar como pago" (recebimento)
  const [payModal, setPayModal] = useState(null); // { id, data_recebido, forma_pagamento }

  useEffect(() => { fetchAll(); }, []);

  function notify(msg, type = 'success') {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function fetchAll() {
    setLoading(true);
    try {
      const [
        { data: recs, error: recErr },
        { data: gas, error: gasErr },
        { data: clis, error: clisErr },
        { data: auts, error: autsErr }
      ] = await Promise.all([
        supabase.from('inn_recebimentos').select('*').order('data_prevista', { ascending: true }),
        supabase.from('inn_gastos').select('*').order('data_prevista', { ascending: true }),
        supabase.from('inn_clientes').select('id, nome').order('nome'),
        supabase.from('inn_automacoes').select('id, nome').order('nome')
      ]);

      if (recErr) { console.error('Erro recebimentos:', recErr); notify('Erro ao carregar recebimentos', 'error'); }
      if (gasErr) { console.error('Erro gastos:', gasErr); notify('Erro ao carregar gastos', 'error'); }
      if (clisErr) console.error('Erro clientes:', clisErr);
      if (autsErr) console.error('Erro automações:', autsErr);

      setRecebimentos(recs || []);
      setGastos(gas || []);
      setClientes(clis || []);
      setAutomacoes(auts || []);
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
      notify('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }

  // === MÉTRICAS DA VISÃO GERAL ===
  const totalAReceber = recebimentos
    .filter(r => r.status === 'Pendente')
    .reduce((acc, r) => acc + Number(r.valor || 0), 0);

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const noMesAtual = (dataStr) => {
    if (!dataStr) return false;
    const d = new Date(dataStr + 'T12:00');
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  };

  const recebidoMes = recebimentos
    .filter(r => r.status === 'Pago' && noMesAtual(r.data_recebido))
    .reduce((acc, r) => acc + Number(r.valor || 0), 0);

  const gastosFixosMes = gastos
    .filter(g => g.tipo === 'Fixo' && g.recorrencia === 'Mensal')
    .reduce((acc, g) => acc + Number(g.valor || 0), 0);

  const gastosPagosMes = gastos
    .filter(g => g.status === 'Pago' && noMesAtual(g.data_pago))
    .reduce((acc, g) => acc + Number(g.valor || 0), 0);

  const resultadoMes = recebidoMes - gastosPagosMes;

  // Próximos 30 dias
  const proximos30 = (() => {
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    const items = [];
    recebimentos.filter(r => r.status === 'Pendente' && r.data_prevista).forEach(r => {
      const d = new Date(r.data_prevista + 'T12:00');
      if (d <= limite) items.push({ ...r, _kind: 'entrada' });
    });
    gastos.filter(g => g.status === 'Pendente' && g.data_prevista).forEach(g => {
      const d = new Date(g.data_prevista + 'T12:00');
      if (d <= limite) items.push({ ...g, _kind: 'saida' });
    });
    return items.sort((a, b) => new Date(a.data_prevista) - new Date(b.data_prevista));
  })();

  // === RECEBIMENTOS: FILTROS ===
  const recebimentosFiltrados = recebimentos.filter(r => {
    if (recStatusFilter !== 'Todos' && r.status !== recStatusFilter) return false;
    if (recTipoFilter !== 'Todos' && r.tipo !== recTipoFilter) return false;
    return true;
  });

  // === GASTOS: FILTROS ===
  const gastosFiltrados = gastos.filter(g => {
    if (gasTipoFilter !== 'Todos' && g.tipo !== gasTipoFilter) return false;
    if (gasStatusFilter !== 'Todos' && g.status !== gasStatusFilter) return false;
    if (gasCatFilter !== 'Todas' && g.categoria !== gasCatFilter) return false;
    return true;
  });

  // === CRUD RECEBIMENTOS ===
  function openRecModal(rec = null) {
    if (rec) {
      setRecForm({
        descricao: rec.descricao || '',
        tipo: rec.tipo || 'Implantação',
        valor: rec.valor || '',
        parcelas: rec.parcelas || 1,
        parcela_atual: rec.parcela_atual || 1,
        forma_pagamento: rec.forma_pagamento || 'PIX',
        status: rec.status || 'Pendente',
        data_prevista: rec.data_prevista || '',
        data_recebido: rec.data_recebido || '',
        cliente_id: rec.cliente_id || '',
        automacao_id: rec.automacao_id || '',
        observacoes: rec.observacoes || '',
        comprovante_url: rec.comprovante_url || ''
      });
      setRecEditId(rec.id);
    } else {
      setRecForm(emptyRecebimento);
      setRecEditId(null);
    }
    setRecModal(true);
  }

  async function saveRecebimento() {
    if (!recForm.descricao.trim()) { notify('Descrição é obrigatória', 'error'); return; }
    const payload = {
      descricao: recForm.descricao.trim(),
      tipo: recForm.tipo,
      valor: parseFloat(recForm.valor) || 0,
      parcelas: parseInt(recForm.parcelas) || 1,
      parcela_atual: parseInt(recForm.parcela_atual) || 1,
      forma_pagamento: recForm.forma_pagamento,
      status: recForm.status,
      data_prevista: recForm.data_prevista || null,
      data_recebido: recForm.status === 'Pago' ? (recForm.data_recebido || todayISO()) : null,
      cliente_id: recForm.cliente_id || null,
      automacao_id: recForm.automacao_id || null,
      observacoes: recForm.observacoes || null,
      comprovante_url: recForm.comprovante_url || null
    };

    if (recEditId) {
      const { data, error } = await supabase.from('inn_recebimentos').update(payload).eq('id', recEditId).select().single();
      if (error) { notify('Erro ao salvar: ' + error.message, 'error'); return; }
      setRecebimentos(prev => prev.map(r => r.id === recEditId ? data : r));
      notify('Recebimento atualizado');
    } else {
      const { data, error } = await supabase.from('inn_recebimentos').insert([payload]).select().single();
      if (error) { notify('Erro ao salvar: ' + error.message, 'error'); return; }
      setRecebimentos(prev => [data, ...prev]);
      notify('Recebimento registrado');
    }
    setRecModal(false);
    setRecForm(emptyRecebimento);
    setRecEditId(null);
  }

  async function confirmarPago() {
    const { id, data_recebido, forma_pagamento } = payModal;
    const payload = {
      status: 'Pago',
      data_recebido: data_recebido || todayISO(),
      forma_pagamento
    };
    const { data, error } = await supabase.from('inn_recebimentos').update(payload).eq('id', id).select().single();
    if (error) { notify('Erro ao marcar como pago: ' + error.message, 'error'); return; }
    setRecebimentos(prev => prev.map(r => r.id === id ? data : r));
    setPayModal(null);
    notify('Recebimento marcado como pago');
  }

  // === CRUD GASTOS ===
  function openGasModal(gas = null) {
    if (gas) {
      setGasForm({
        descricao: gas.descricao || '',
        categoria: gas.categoria || 'Operacional',
        tipo: gas.tipo || 'Variável',
        recorrencia: gas.recorrencia || 'Único',
        valor: gas.valor || '',
        forma_pagamento: gas.forma_pagamento || 'PIX',
        status: gas.status || 'Pendente',
        data_prevista: gas.data_prevista || '',
        data_pago: gas.data_pago || '',
        automacao_id: gas.automacao_id || '',
        observacoes: gas.observacoes || ''
      });
      setGasEditId(gas.id);
    } else {
      setGasForm(emptyGasto);
      setGasEditId(null);
    }
    setGasModal(true);
  }

  async function saveGasto() {
    if (!gasForm.descricao.trim()) { notify('Descrição é obrigatória', 'error'); return; }
    const payload = {
      descricao: gasForm.descricao.trim(),
      categoria: gasForm.categoria,
      tipo: gasForm.tipo,
      recorrencia: gasForm.recorrencia,
      valor: parseFloat(gasForm.valor) || 0,
      forma_pagamento: gasForm.forma_pagamento,
      status: gasForm.status,
      data_prevista: gasForm.data_prevista || null,
      data_pago: gasForm.status === 'Pago' ? (gasForm.data_pago || todayISO()) : null,
      automacao_id: gasForm.automacao_id || null,
      observacoes: gasForm.observacoes || null
    };

    if (gasEditId) {
      const { data, error } = await supabase.from('inn_gastos').update(payload).eq('id', gasEditId).select().single();
      if (error) { notify('Erro ao salvar: ' + error.message, 'error'); return; }
      setGastos(prev => prev.map(g => g.id === gasEditId ? data : g));
      notify('Gasto atualizado');
    } else {
      const { data, error } = await supabase.from('inn_gastos').insert([payload]).select().single();
      if (error) { notify('Erro ao salvar: ' + error.message, 'error'); return; }
      setGastos(prev => [data, ...prev]);
      notify('Gasto registrado');
    }
    setGasModal(false);
    setGasForm(emptyGasto);
    setGasEditId(null);
  }

  // ====================== RENDER ======================
  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>Carregando dados financeiros...</div>;
  }

  return (
    <div>
      <FeedbackBanner feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Controle de recebimentos, gastos e resultado mensal</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'recebimentos', label: 'Recebimentos' },
          { id: 'gastos', label: 'Gastos' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', padding: '0 0 12px 0',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              color: tab === t.id ? 'var(--primary)' : 'var(--text-2)',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== TAB: VISÃO GERAL ===================== */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <MetricCard title="Total a Receber" value={fmtBRL(totalAReceber)} accent="#FBBF24" icon={ArrowUpRight}
              sub={`${recebimentos.filter(r => r.status === 'Pendente').length} pendentes`} />
            <MetricCard title="Recebido no Mês" value={fmtBRL(recebidoMes)} accent="#00FFB2" icon={TrendingUp}
              sub={`${recebimentos.filter(r => r.status === 'Pago' && noMesAtual(r.data_recebido)).length} pagamentos`} />
            <MetricCard title="Gastos Fixos / Mês" value={fmtBRL(gastosFixosMes)} accent="#A78BFA" icon={TrendingDown}
              sub={`${gastos.filter(g => g.tipo === 'Fixo' && g.recorrencia === 'Mensal').length} recorrências`} />
            <MetricCard title="Resultado do Mês" value={fmtBRL(resultadoMes)} accent={resultadoMes >= 0 ? '#00FFB2' : '#EF4444'}
              icon={resultadoMes >= 0 ? TrendingUp : TrendingDown}
              sub={`Recebido − gastos pagos`} />
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Calendar size={16} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Próximos 30 dias</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>({proximos30.length} itens)</span>
            </div>
            {proximos30.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: '0.85rem' }}>
                Nenhum vencimento nos próximos 30 dias.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {proximos30.map(item => {
                  const isEntrada = item._kind === 'entrada';
                  const cor = isEntrada ? '#00FFB2' : '#EF4444';
                  return (
                    <div key={`${item._kind}-${item.id}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8, borderLeft: `3px solid ${cor}`, gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        {isEntrada ? <ArrowUpRight size={16} color={cor} /> : <ArrowDownRight size={16} color={cor} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.descricao}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: 2 }}>
                            {isEntrada ? item.tipo : item.categoria} · {fmtDate(item.data_prevista)}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: cor, whiteSpace: 'nowrap' }}>
                        {isEntrada ? '+' : '−'} {fmtBRL(item.valor)}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB: RECEBIMENTOS ===================== */}
      {tab === 'recebimentos' && (
        <div>
          <div style={{
            display: 'flex', gap: 16, marginBottom: 20, padding: 16, alignItems: 'center', flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)'
          }}>
            <Filter size={14} color="var(--text-2)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600 }}>Filtros:</span>
            <select className="form-select" style={{ width: 'auto', minWidth: 130, padding: '6px 12px', height: 'auto' }}
              value={recStatusFilter} onChange={e => setRecStatusFilter(e.target.value)}>
              <option>Todos</option>
              {RECEBIMENTO_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: 130, padding: '6px 12px', height: 'auto' }}
              value={recTipoFilter} onChange={e => setRecTipoFilter(e.target.value)}>
              <option>Todos</option>
              {RECEBIMENTO_TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => openRecModal()}>
              <Plus size={16} /> Registrar Recebimento
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}>
            {recebimentosFiltrados.length} recebimento(s)
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-2)' }}>
                    {['Cliente', 'Descrição', 'Tipo', 'Valor', 'Forma', 'Vencimento', 'Status', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recebimentosFiltrados.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--text-2)' }}>Nenhum recebimento.</td></tr>
                  ) : recebimentosFiltrados.map(r => {
                    const cliente = clientes.find(c => c.id === r.cliente_id);
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 500 }}>{cliente?.nome || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{r.descricao}</div>
                          {r.parcelas > 1 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginTop: 2 }}>
                              Parcela {r.parcela_atual}/{r.parcelas}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="tag">{r.tipo}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary)' }}>{fmtBRL(r.valor)}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{r.forma_pagamento}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{fmtDate(r.data_prevista)}</td>
                        <td style={{ padding: '12px 14px' }}><StatusBadge status={r.status} /></td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {r.status === 'Pendente' && (
                              <button className="btn btn-ghost" title="Marcar como pago"
                                style={{ padding: 6, color: '#00FFB2' }}
                                onClick={() => setPayModal({ id: r.id, data_recebido: todayISO(), forma_pagamento: r.forma_pagamento || 'PIX' })}>
                                <Check size={14} />
                              </button>
                            )}
                            <button className="btn btn-ghost" title="Editar" style={{ padding: 6 }} onClick={() => openRecModal(r)}>
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: GASTOS ===================== */}
      {tab === 'gastos' && (
        <div>
          <div style={{
            display: 'flex', gap: 16, marginBottom: 20, padding: 16, alignItems: 'center', flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)'
          }}>
            <Filter size={14} color="var(--text-2)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600 }}>Filtros:</span>
            <select className="form-select" style={{ width: 'auto', minWidth: 130, padding: '6px 12px', height: 'auto' }}
              value={gasTipoFilter} onChange={e => setGasTipoFilter(e.target.value)}>
              <option>Todos</option>
              {GASTO_TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: 130, padding: '6px 12px', height: 'auto' }}
              value={gasStatusFilter} onChange={e => setGasStatusFilter(e.target.value)}>
              <option>Todos</option>
              {GASTO_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: 130, padding: '6px 12px', height: 'auto' }}
              value={gasCatFilter} onChange={e => setGasCatFilter(e.target.value)}>
              <option>Todas</option>
              {GASTO_CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => openGasModal()}>
              <Plus size={16} /> Registrar Gasto
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}>
            {gastosFiltrados.length} gasto(s)
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-2)' }}>
                    {['Descrição', 'Categoria', 'Tipo', 'Valor', 'Recorrência', 'Vencimento', 'Status', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gastosFiltrados.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--text-2)' }}>Nenhum gasto.</td></tr>
                  ) : gastosFiltrados.map(g => (
                    <tr key={g.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{g.descricao}</td>
                      <td style={{ padding: '12px 14px' }}><span className="tag">{g.categoria}</span></td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{g.tipo}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#EF4444' }}>{fmtBRL(g.valor)}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{g.recorrencia}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>{fmtDate(g.data_prevista)}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={g.status} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <button className="btn btn-ghost" title="Editar" style={{ padding: 6 }} onClick={() => openGasModal(g)}>
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: RECEBIMENTO ===================== */}
      {recModal && (
        <div className="modal-overlay" onClick={() => setRecModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{recEditId ? 'Editar Recebimento' : 'Registrar Recebimento'}</span>
              <button className="modal-close" onClick={() => setRecModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <input className="form-input" placeholder="Ex: Implantação chatbot Acme"
                  value={recForm.descricao} onChange={e => setRecForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={recForm.tipo}
                    onChange={e => setRecForm(f => ({ ...f, tipo: e.target.value }))}>
                    {RECEBIMENTO_TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor (R$)</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0,00"
                    value={recForm.valor} onChange={e => setRecForm(f => ({ ...f, valor: e.target.value }))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Parcelas</label>
                  <input className="form-input" type="number" min="1"
                    value={recForm.parcelas} onChange={e => setRecForm(f => ({ ...f, parcelas: e.target.value }))} />
                </div>
                {Number(recForm.parcelas) > 1 && (
                  <div className="form-group">
                    <label className="form-label">Parcela Atual</label>
                    <input className="form-input" type="number" min="1" max={recForm.parcelas}
                      value={recForm.parcela_atual} onChange={e => setRecForm(f => ({ ...f, parcela_atual: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select className="form-select" value={recForm.forma_pagamento}
                    onChange={e => setRecForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
                    {FORMAS_PAGAMENTO.map(fp => <option key={fp}>{fp}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={recForm.status}
                    onChange={e => setRecForm(f => ({ ...f, status: e.target.value }))}>
                    {RECEBIMENTO_STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data Prevista</label>
                  <input className="form-input" type="date"
                    value={recForm.data_prevista} onChange={e => setRecForm(f => ({ ...f, data_prevista: e.target.value }))} />
                </div>
                {recForm.status === 'Pago' && (
                  <div className="form-group">
                    <label className="form-label">Data Recebido</label>
                    <input className="form-input" type="date"
                      value={recForm.data_recebido} onChange={e => setRecForm(f => ({ ...f, data_recebido: e.target.value }))} />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <select className="form-select" value={recForm.cliente_id}
                    onChange={e => setRecForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">— Selecionar —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Projeto relacionado</label>
                  <select className="form-select" value={recForm.automacao_id}
                    onChange={e => setRecForm(f => ({ ...f, automacao_id: e.target.value }))}>
                    <option value="">— Nenhum —</option>
                    {automacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link do comprovante</label>
                <input className="form-input" placeholder="https://..."
                  value={recForm.comprovante_url} onChange={e => setRecForm(f => ({ ...f, comprovante_url: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" placeholder="Notas internas..."
                  value={recForm.observacoes} onChange={e => setRecForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRecModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveRecebimento}>
                <Check size={16} /> {recEditId ? 'Salvar Alterações' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MINI-MODAL: MARCAR COMO PAGO ===================== */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Marcar como pago</span>
              <button className="modal-close" onClick={() => setPayModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Data do recebimento</label>
                <input className="form-input" type="date"
                  value={payModal.data_recebido}
                  onChange={e => setPayModal(p => ({ ...p, data_recebido: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Forma de pagamento</label>
                <select className="form-select" value={payModal.forma_pagamento}
                  onChange={e => setPayModal(p => ({ ...p, forma_pagamento: e.target.value }))}>
                  {FORMAS_PAGAMENTO.map(fp => <option key={fp}>{fp}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPayModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarPago}><Check size={16} /> Confirmar pagamento</button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: GASTO ===================== */}
      {gasModal && (
        <div className="modal-overlay" onClick={() => setGasModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{gasEditId ? 'Editar Gasto' : 'Registrar Gasto'}</span>
              <button className="modal-close" onClick={() => setGasModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <input className="form-input" placeholder="Ex: Assinatura n8n cloud"
                  value={gasForm.descricao} onChange={e => setGasForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={gasForm.categoria}
                    onChange={e => setGasForm(f => ({ ...f, categoria: e.target.value }))}>
                    {GASTO_CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={gasForm.tipo}
                    onChange={e => setGasForm(f => ({ ...f, tipo: e.target.value }))}>
                    {GASTO_TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Recorrência</label>
                  <select className="form-select" value={gasForm.recorrencia}
                    onChange={e => setGasForm(f => ({ ...f, recorrencia: e.target.value }))}>
                    {GASTO_RECORRENCIAS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valor (R$)</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0,00"
                    value={gasForm.valor} onChange={e => setGasForm(f => ({ ...f, valor: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select className="form-select" value={gasForm.forma_pagamento}
                    onChange={e => setGasForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
                    {FORMAS_PAGAMENTO.map(fp => <option key={fp}>{fp}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={gasForm.status}
                    onChange={e => setGasForm(f => ({ ...f, status: e.target.value }))}>
                    {GASTO_STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data Prevista</label>
                  <input className="form-input" type="date"
                    value={gasForm.data_prevista} onChange={e => setGasForm(f => ({ ...f, data_prevista: e.target.value }))} />
                </div>
                {gasForm.status === 'Pago' && (
                  <div className="form-group">
                    <label className="form-label">Data Pago</label>
                    <input className="form-input" type="date"
                      value={gasForm.data_pago} onChange={e => setGasForm(f => ({ ...f, data_pago: e.target.value }))} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Projeto vinculado (opcional)</label>
                <select className="form-select" value={gasForm.automacao_id}
                  onChange={e => setGasForm(f => ({ ...f, automacao_id: e.target.value }))}>
                  <option value="">— Nenhum —</option>
                  {automacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" placeholder="Notas internas..."
                  value={gasForm.observacoes} onChange={e => setGasForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setGasModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveGasto}>
                <Check size={16} /> {gasEditId ? 'Salvar Alterações' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
