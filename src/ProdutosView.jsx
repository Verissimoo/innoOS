import React from 'react';
import { Plus, MessageSquare, DollarSign, Layout, Cpu, Users, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { PRODUCTS } from './data';

export default function ProdutosView() {
const MOCK_PRODUCTS = PRODUCTS;
  return (
    <div className="produtos-content fade-in">
      <header className="produtos-header">
        <div>
          <h1>Catálogo de Produtos</h1>
          <p className="subtitle">Soluções e ativos tecnológicos desenvolvidos pela equipe Innohvasion</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          <span>Novo Produto</span>
        </button>
      </header>

      <section className="produtos-grid">
        {MOCK_PRODUCTS.map((prod) => (
          <div key={prod.id} className="product-card">
            <div className="card-top">
              <div className="icon-badge" style={{ backgroundColor: `${prod.color}15`, color: prod.color }}>
                <prod.icon size={24} />
              </div>
              <span className={`status-pill ${prod.status.toLowerCase().replace(/ /g, '-')}`}>
                {prod.status}
              </span>
            </div>
            
            <div className="card-body">
              <div className="category-tag">{prod.category}</div>
              <h3>{prod.name}</h3>
              <p>{prod.description}</p>
              
              <div className="stack-labels">
                {prod.stack.map((tech, idx) => (
                  <span key={idx} className="stack-tag">{tech}</span>
                ))}
              </div>
            </div>

            <div className="card-footer">
              <div className="footer-stat">
                <Users size={14} />
                <span>{prod.clientsCount} Clientes</span>
              </div>
              <div className="footer-stat">
                <Calendar size={14} />
                <span>{prod.launchDate}</span>
              </div>
            </div>

            <button className="details-btn">
              <span>Ver Detalhes</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </section>

      <style jsx>{`
        .produtos-content { padding: 40px; display: flex; flex-direction: column; gap: 32px; flex: 1; }
        .produtos-header { display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 1.875rem; font-weight: 700; }
        .subtitle { color: var(--text-dim); font-size: 0.9rem; }
        
        .btn-primary { background: var(--primary); color: var(--bg-dark); padding: 10px 20px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-primary:hover { transform: scale(1.02); box-shadow: 0 0 15px rgba(0, 255, 178, 0.4); }

        .produtos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        
        .product-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 20px; transition: all 0.3s; position: relative; overflow: hidden; }
        .product-card:hover { transform: translateY(-5px); border-color: rgba(255, 255, 255, 0.1); box-shadow: 0 20px 40px -20px rgba(0,0,0,0.6); }
        
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .icon-badge { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); }
        
        .status-pill { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .status-pill.disponível { background: rgba(0, 255, 178, 0.1); color: #00FFB2; }
        .status-pill.em-desenvolvimento { background: rgba(0, 229, 255, 0.1); color: #00E5FF; }
        .status-pill.descontinuado { background: rgba(255, 77, 77, 0.1); color: #FF4D4D; }

        .category-tag { font-size: 0.75rem; color: var(--text-dim); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        h3 { font-size: 1.25rem; font-weight: 700; margin-top: 4px; }
        p { font-size: 0.9rem; color: var(--text-dim); line-height: 1.5; margin-top: 8px; }

        .stack-labels { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .stack-tag { font-size: 0.7rem; padding: 4px 8px; border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-main); font-weight: 500; }

        .card-footer { display: flex; gap: 16px; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-color); }
        .footer-stat { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-dim); }

        .details-btn { width: 100%; padding: 12px; border-radius: 10px; background: transparent; border: 1px solid var(--border-color); color: var(--text-main); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; margin-top: 12px; }
        .details-btn:hover { background: rgba(255,255,255,0.05); border-color: var(--text-dim); }

        /* Background glow effect on hover */
        .product-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(0, 255, 178, 0.03), transparent 60%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .product-card:hover::before { opacity: 1; }

        @media (max-width: 768px) { .produtos-header { flex-direction: column; align-items: flex-start; gap: 16px; } }
      `}</style>
    </div>
  );
}
