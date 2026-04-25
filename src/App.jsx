import React, { useState, useEffect, useRef } from 'react';
import { Zap, Bell, Search, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import AutomacoesView from './AutomacoesView';
import ClientesView from './ClientesView';
import AgendaRituaisView from './AgendaRituaisView';
import BacklogView from './BacklogView';
import ProjetoDetalheView from './ProjetoDetalheView';
import IdeiaDetalheView from './IdeiaDetalheView';
import { CURRENT_USER } from './data';
import { supabase } from './lib/supabase';

export default function App() {
  const [section, setSection] = useState('dashboard');
  const [selectedAutomacao, setSelectedAutomacao] = useState(null);
  const [selectedIdeia, setSelectedIdeia] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (query.length > 1) {
      const searchAll = async () => {
        try {
          const [{ data: auts }, { data: clis }, { data: ids }] = await Promise.all([
            supabase.from('inn_automacoes').select('nome').ilike('nome', `%${query}%`).limit(3),
            supabase.from('inn_clientes').select('nome').ilike('nome', `%${query}%`).limit(3),
            supabase.from('inn_ideias').select('titulo').ilike('titulo', `%${query}%`).limit(3)
          ]);
          const a = (auts || []).map(x => ({ label: x.nome, type: 'Automação', tab: 'automacoes' }));
          const c = (clis || []).map(x => ({ label: x.nome, type: 'Cliente', tab: 'clientes' }));
          const i = (ids || []).map(x => ({ label: x.titulo, type: 'Ideia', tab: 'backlog' }));
          setResults([...a, ...c, ...i].slice(0, 6));
        } catch (err) {
          console.error(err);
        }
      };
      searchAll();
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavigation = (tab) => {
    setSection(tab);
    setSelectedAutomacao(null);
    setSelectedIdeia(null);
  };

  const handleResultClick = (tab) => {
    handleNavigation(tab);
    setQuery('');
    setShowSearch(false);
  };

  const renderPage = () => {
    if (section === 'automacoes' && selectedAutomacao) {
      return <ProjetoDetalheView projeto={selectedAutomacao} onBack={() => setSelectedAutomacao(null)} />;
    }
    if (section === 'backlog' && selectedIdeia) {
      return <IdeiaDetalheView ideia={selectedIdeia} onBack={() => setSelectedIdeia(null)} />;
    }

    const pages = {
      dashboard: <Dashboard onNavigate={handleNavigation} />,
      automacoes: <AutomacoesView onSelectAutomacao={setSelectedAutomacao} />,
      clientes: <ClientesView />,
      agenda: <AgendaRituaisView />,
      backlog: <BacklogView onSelectIdeia={setSelectedIdeia} />,
    };
    return pages[section] || pages.dashboard;
  };

  return (
    <div className="app-layout">
      <Sidebar active={section} onSelect={handleNavigation} />

      <div className="app-main">
        {/* ── TOP HEADER ── */}
        <header className="top-header">
          <div className="header-search" ref={searchRef}>
            <Search size={16} className="search-icon" />
            <input
              placeholder="Buscar automações, clientes..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ color: 'var(--text-2)', flexShrink: 0 }}>
                <X size={14} />
              </button>
            )}
            {showSearch && query.length > 1 && (
              <div className="search-dropdown">
                {results.length > 0 ? results.map((r, i) => (
                  <div key={i} className="search-item" onClick={() => handleResultClick(r.tab)}>
                    <div>
                      <div className="search-item-name">{r.label}</div>
                    </div>
                    <div className="search-item-type">{r.type}</div>
                  </div>
                )) : (
                  <div className="search-empty">Nenhum resultado</div>
                )}
              </div>
            )}
          </div>

          <div className="header-right">
            <button className="notif-btn">
              <Bell size={17} />
              <div className="notif-dot" />
            </button>

            <div className="user-chip">
              <div className="user-avatar">{CURRENT_USER.initials}</div>
              <div>
                <div className="user-name">{CURRENT_USER.name.split(' ')[0]}</div>
                <div className="user-role">{CURRENT_USER.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE ── */}
        <div className="page-content fade-up" key={section}>
          {renderPage()}
        </div>

        {/* ── FOOTER ── */}
        <footer className="app-footer">
          <Zap size={12} color="var(--primary)" />
          <strong>Innohvasion OS</strong>
          <span>v1.0 · Soluções Inteligentes</span>
        </footer>
      </div>
    </div>
  );
}
