import React, { useState } from 'react';
import { Users, Zap, Loader, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import KPICard from './KPICard';
import { COMPROMISSOS, FINANCEIRO, STATUS_CONFIG } from './data';
import { supabase } from './lib/supabase';

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {};
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label || status}
    </span>
  );
}

export default function Dashboard({ onNavigate }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeClients: 0, activeAuto: 0, implantando: 0, mrr: 0, totalRecebidoImpl: 0, automacoes: [] });

  React.useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [{ data: clis }, { data: auts }] = await Promise.all([
          supabase.from('inn_clientes').select('status'),
          supabase.from('inn_automacoes').select('*, inn_clientes(nome)')
        ]);
        const clientes = clis || [];
        const automacoes = auts || [];
        
        const activeClients = clientes.filter(c => c.status === 'Ativo').length;
        const activeAuto = automacoes.filter(a => a.status === 'Ativa').length;
        const implantando = automacoes.filter(a => a.status === 'Em Implantação').length;
        const mrr = automacoes.filter(a => a.status === 'Ativa').reduce((acc, a) => acc + (a.valor_mensal || 0), 0);
        const totalRecebidoImpl = automacoes.filter(a => a.pago).reduce((acc, a) => acc + (a.valor_impl || 0), 0);

        setStats({ activeClients, activeAuto, implantando, mrr, totalRecebidoImpl, automacoes });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  // Próximos 7 dias
  const upcomingDays = 7;
  const upcoming = COMPROMISSOS.filter(c => {
    const diff = (new Date(c.data) - today) / 86400000;
    return diff >= 0 && diff <= upcomingDays;
  }).sort((a, b) => new Date(a.data) - new Date(b.data));

  const tipoColors = {
    'Reunião Cliente': '#00FFB2',
    'Interna': '#60A5FA',
    'Entrega': '#FFB800',
    'Outro': '#94A3B8',
  };

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
          Olá, Felipe 👋
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', textTransform: 'capitalize' }}>{dateStr}</p>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <KPICard
          title="Clientes Ativos"
          value={stats.activeClients}
          icon={Users}
          accent="var(--primary)"
          trend="↑ Crescimento mensal"
        />
        <KPICard
          title="Automações Ativas"
          value={stats.activeAuto}
          icon={Zap}
          accent="var(--primary)"
          trend={`+ ${stats.implantando} em implantação`}
        />
        <KPICard
          title="Em Implantação"
          value={stats.implantando}
          icon={Loader}
          accent="var(--amber)"
          trend="Em andamento"
        />
        <KPICard
          title="MRR Total"
          value={`R$ ${stats.mrr.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          accent="#A78BFA"
          trend={`+ R$ ${(stats.totalRecebidoImpl || 0).toLocaleString('pt-BR')} em implementações (recebido)`}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Health Panel */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 2 }}>Saúde das Automações</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>Visão geral de todas as soluções</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('automacoes')}>Ver todas →</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-2)' }}>Carregando dados...</div>
              ) : stats.automacoes.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-2)' }}>Nenhuma automação cadastrada.</div>
              ) : (
                stats.automacoes.map(a => {
                  const cfg = STATUS_CONFIG[a.status] || {};
                  const clienteNome = a.inn_clientes?.nome || 'Portfólio Interno';
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${cfg.color}25`,
                      borderRadius: 10,
                      borderLeft: `3px solid ${cfg.color}`,
                      gap: 12,
                    }}>
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{clienteNome} · <span style={{ color: 'var(--text-2)' }}>{a.categoria}</span></div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Financeiro */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 18 }}>Resumo Financeiro</div>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '18px 20px', background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.15)', borderRadius: 12 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Total Implementações (Recebido)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>R$ {(stats.totalRecebidoImpl || 0).toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 6 }}>{stats.automacoes?.filter(a => a.pago).length || 0} projetos pagos</div>
              </div>
              <div style={{ padding: '18px 20px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recorrência Mensal (MRR)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#A78BFA' }}>R$ {stats.mrr.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 6 }}>{stats.activeAuto} automações ativas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Próximos Compromissos */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Próximos Compromissos</div>
              <Calendar size={16} color="var(--text-2)" />
            </div>
            {upcoming.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 3, borderRadius: 99, marginTop: 4, flexShrink: 0,
                      background: tipoColors[c.tipo] || '#94A3B8',
                      alignSelf: 'stretch',
                    }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>{c.titulo}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
                        {new Date(c.data + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} · {c.hora}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Nenhum compromisso nos próximos 7 dias.</div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16 }}>Portfólio em Construção</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                <div style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>Carregando...</div>
              ) : stats.automacoes.filter(a => a.status === 'Portfólio').length === 0 ? (
                <div style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>Nenhuma no portfólio.</div>
              ) : (
                stats.automacoes.filter(a => a.status === 'Portfólio').map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#60A5FA', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.83rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                    <span className="badge" style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA', border: '1px solid #60A5FA30', fontSize: '0.65rem' }}>
                      {a.categoria}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
