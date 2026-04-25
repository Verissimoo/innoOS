import React from 'react';

export default function KPICard({ title, value, sub, icon: Icon, accent = 'var(--primary)', trend }) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-2)' }}>
          {title}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `rgba(${accent === 'var(--primary)' ? '0,255,178' : accent === 'var(--amber)' ? '255,184,0' : accent === 'var(--secondary)' ? '96,165,250' : '167,139,250'},0.12)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
        }}>
          <Icon size={18} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--text)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 6 }}>{sub}</div>
      )}
      {trend !== undefined && (
        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: 8 }}>
          {trend}
        </div>
      )}
    </div>
  );
}
