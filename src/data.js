// ============================================
// INNOHVASION OS — Central Data Store
// ============================================

export const CURRENT_USER = {
  name: 'Felipe Verissimo',
  role: 'Founder & CEO',
  initials: 'FV',
};

export const AUTOMACOES = [];

export const CLIENTES = [];

export const FINANCEIRO = {
  totalRecebidoImpl: 0,
  mrr: 0,
  historicoPagamentos: [],
};

export const RITUAIS = [];

export const COMPROMISSOS = [];

export const IDEIAS = [];

// ─── HELPERS ─────────────────────────────────
export const STATUS_CONFIG = {
  'Ativa': { color: '#00FFB2', bg: 'rgba(0,255,178,0.12)', label: 'Ativa' },
  'Em Implantação': { color: '#FFB800', bg: 'rgba(255,184,0,0.12)', label: 'Em Implantação' },
  'Portfólio': { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', label: 'Portfólio' },
  'Ideia': { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: 'Ideia' },
  'Pausada': { color: '#FF4D4D', bg: 'rgba(255,77,77,0.12)', label: 'Pausada' },
  'Ativo': { color: '#00FFB2', bg: 'rgba(0,255,178,0.12)', label: 'Ativo' },
  'Analisando': { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'Analisando' },
  'Desenvolvendo': { color: '#FFB800', bg: 'rgba(255,184,0,0.12)', label: 'Desenvolvendo' },
  'Pronto': { color: '#00FFB2', bg: 'rgba(0,255,178,0.12)', label: 'Pronto' },
};
