// ============================================
// INNOHVASION OS — Central Data Store
// ============================================

export const CURRENT_USER = {
  name: 'Felipe Verissimo',
  role: 'Founder & CEO',
  initials: 'FV',
};

// ─── AUTOMAÇÕES ─────────────────────────────
export const AUTOMACOES = [
  // PORTFÓLIO
  {
    id: 1,
    nome: 'IA de Atendimento via WhatsApp',
    categoria: 'Atendimento',
    tipo: 'Portfólio',
    status: 'Portfólio',
    cliente: null,
    descricao: 'Agente de IA que responde dúvidas, qualifica leads e agenda reuniões automaticamente via WhatsApp Business API.',
    stack: ['n8n', 'WhatsApp API', 'GPT-4', 'Typebot'],
    valorImpl: 0,
    valorMensal: 0,
    dataInicio: '2026-03-01',
    observacoes: 'Produto carro-chefe do portfólio. Em fase de testes com dados sintéticos.',
  },
  {
    id: 2,
    nome: 'Qualificação Automática de Leads',
    categoria: 'Prospecção',
    tipo: 'Portfólio',
    status: 'Portfólio',
    cliente: null,
    descricao: 'Pipeline automatizado que captura leads de anúncios, qualifica via perguntas inteligentes e distribui para o time comercial.',
    stack: ['n8n', 'Meta Ads API', 'Google Sheets', 'Typebot'],
    valorImpl: 0,
    valorMensal: 0,
    dataInicio: '2026-03-15',
    observacoes: 'Integração com Meta Ads em desenvolvimento.',
  },
  {
    id: 3,
    nome: 'Régua de Cobrança Automática',
    categoria: 'Financeiro',
    tipo: 'Portfólio',
    status: 'Portfólio',
    cliente: null,
    descricao: 'Sistema de régua de comunicação automática para cobranças: lembretes D-3, D-1, vencimento e pós-vencimento via WhatsApp.',
    stack: ['n8n', 'WhatsApp API', 'Google Sheets', 'Asaas'],
    valorImpl: 0,
    valorMensal: 0,
    dataInicio: '2026-02-20',
    observacoes: 'Baseado na solução implementada na Passagens Com Desconto. Pronto para comercializar.',
  },

  // CLIENTES REAIS
  {
    id: 4,
    nome: 'Automação de Cobranças e Follow-up',
    categoria: 'Financeiro',
    tipo: 'Cliente - Ativa',
    status: 'Ativa',
    cliente: 1, // Passagens Com Desconto
    descricao: 'Régua automática de cobrança via WhatsApp para clientes com pagamentos pendentes. Envia lembretes, confirma pagamentos e atualiza planilha de controle.',
    stack: ['n8n', 'WhatsApp API', 'Google Sheets', 'Asaas'],
    valorImpl: 1000,
    valorMensal: 500,
    dataInicio: '2026-02-01',
    observacoes: 'Rodando há 2 meses. Taxa de resposta > 70%. Cliente satisfeito.',
  },
  {
    id: 5,
    nome: 'Relatório Financeiro Automático',
    categoria: 'Financeiro',
    tipo: 'Cliente - Ativa',
    status: 'Ativa',
    cliente: 1, // Passagens Com Desconto
    descricao: 'Geração e envio automático de relatório financeiro semanal consolidando receitas, despesas e indicadores-chave diretamente para o WhatsApp do gestor.',
    stack: ['n8n', 'Google Sheets', 'WhatsApp API'],
    valorImpl: 1000,
    valorMensal: 500,
    dataInicio: '2026-03-01',
    observacoes: 'Segunda automação contratada. Entrega toda segunda-feira às 08h.',
  },
  {
    id: 6,
    nome: 'Atendimento WhatsApp Automatizado',
    categoria: 'Atendimento',
    tipo: 'Cliente - Em Implantação',
    status: 'Em Implantação',
    cliente: 2, // Daniela Acessórios
    descricao: 'Chatbot inteligente para atendimento inicial no WhatsApp: catálogo de produtos, perguntas frequentes, coleta de pedidos e triagem de clientes.',
    stack: ['n8n', 'WhatsApp API', 'Typebot', 'Google Sheets'],
    valorImpl: 1000,
    valorMensal: 500,
    dataInicio: '2026-04-01',
    observacoes: 'Mapeamento de fluxos concluído. Aguardando acesso ao WhatsApp Business da cliente.',
  },
];

// ─── CLIENTES ────────────────────────────────
export const CLIENTES = [
  {
    id: 1,
    nome: 'Passagens Com Desconto',
    segmento: 'Turismo / Agência de Viagens',
    status: 'Ativo',
    contato: 'Marcus Vinicius',
    whatsapp: '(11) 99999-1111',
    email: 'marcus@passagenscomdesconto.com.br',
    responsavelInterno: 'Felipe Verissimo',
    dataInicio: '2026-02-01',
    observacoes: 'Primeiro cliente da Innohvasion. Muito comprometido. Potencial para mais automações.',
    notas: [
      { id: 1, data: '10/04/2026', texto: 'Reunião quinzenal realizada. Cliente pediu evolução no relatório financeiro com comparativo mensal.' },
      { id: 2, data: '01/04/2026', texto: 'Segunda automação (Relatório) entregue e aprovada. Início do período de recorrência.' },
      { id: 3, data: '15/02/2026', texto: 'Kickoff do projeto de cobrança automática. Mapeamento de fluxos concluído.' },
    ],
  },
  {
    id: 2,
    nome: 'Daniela Acessórios',
    segmento: 'Moda / Varejo',
    status: 'Em Implantação',
    contato: 'Daniela Souza',
    whatsapp: '(21) 98888-2222',
    email: 'daniela@danielaacessorios.com.br',
    responsavelInterno: 'Felipe Verissimo',
    dataInicio: '2026-04-01',
    observacoes: 'Cliente indicada por Marcus (Passagens). Empreendedora ativa no Instagram. Meta: atender 100+ clientes/dia no WhatsApp.',
    notas: [
      { id: 1, data: '08/04/2026', texto: 'Reunião de discovery concluída. Mapeamento do fluxo de atendimento feito.' },
      { id: 2, data: '01/04/2026', texto: 'Contrato assinado. Taxa de implementação recebida. Início do onboarding.' },
    ],
  },
];

// ─── FINANCEIRO ──────────────────────────────
export const FINANCEIRO = {
  totalRecebidoImpl: 3000, // 3 implementações × R$1.000
  mrr: 1000, // 2 automações ativas × R$500
  historicoPagamentos: [
    { data: '01/02/2026', cliente: 'Passagens Com Desconto', tipo: 'Implementação', valor: 1000 },
    { data: '01/03/2026', cliente: 'Passagens Com Desconto', tipo: 'Implementação', valor: 1000 },
    { data: '01/04/2026', cliente: 'Daniela Acessórios', tipo: 'Implementação', valor: 1000 },
    { data: '01/03/2026', cliente: 'Passagens Com Desconto', tipo: 'Recorrência', valor: 500 },
    { data: '01/04/2026', cliente: 'Passagens Com Desconto', tipo: 'Recorrência', valor: 1000 },
  ],
};

// ─── RITUAIS ─────────────────────────────────
export const RITUAIS = [
  {
    id: 1,
    nome: 'Weekly de Projetos',
    objetivo: 'Revisar o status de todas as automações ativas e em implantação. Identificar bloqueios e definir próximos passos.',
    frequencia: 'Toda segunda-feira',
    duracao: '1h',
    pauta: [
      'Status das automações em implantação',
      'Atualização das automações ativas (métricas)',
      'Bloqueios e impedimentos',
      'Próximos passos + prioridades da semana',
    ],
    ultimaOcorrencia: { data: '07/04/2026', nota: 'Revisado o andamento da implantação Daniela Acessórios. Aguardando acesso WhatsApp Business. Relatório Passagens entregue sem problemas.' },
  },
  {
    id: 2,
    nome: 'Review Quinzenal com Clientes',
    objetivo: 'Check-in de relacionamento e entrega de valor para cada cliente ativo. Coleta de feedback e identificação de oportunidades de expansão.',
    frequencia: 'A cada 15 dias',
    duracao: '30min por cliente',
    pauta: [
      'Resultados e indicadores das automações',
      'Feedback do cliente sobre a solução',
      'Dúvidas e sugestões',
      'Próximas entregas e expectativas',
    ],
    ultimaOcorrencia: { data: '10/04/2026', nota: 'Review com Passagens Com Desconto. Marcus pediu comparativo mensal no relatório. Daniela Acessórios ainda em implantação, não incluída.' },
  },
  {
    id: 3,
    nome: 'Sessão de Portfólio',
    objetivo: 'Avançar no desenvolvimento das automações de portfólio. Documentar, testar e evoluir os produtos internos.',
    frequencia: 'Toda sexta-feira',
    duracao: '1h',
    pauta: [
      'Qual automação do portfólio será trabalhada hoje?',
      'Definir entregável da sessão',
      'Executar e documentar o progresso',
      'Atualizar status no sistema',
    ],
    ultimaOcorrencia: { data: '11/04/2026', nota: 'Avançado no desenvolvimento da Régua de Cobrança Automática. Fluxo de D-3 concluído. Próxima sessão: D-1 e D+1.' },
  },
  {
    id: 4,
    nome: 'Planejamento Semanal Pessoal',
    objetivo: 'Organizar prioridades pessoais e profissionais para a semana. Garantir foco no que importa.',
    frequencia: 'Toda segunda-feira',
    duracao: '30min',
    pauta: [
      'O que precisa ser feito esta semana?',
      'Quais são as 3 prioridades máximas?',
      'Há algum compromisso ou deadline importante?',
      'Como estou me sentindo? O que preciso de energia?',
    ],
    ultimaOcorrencia: { data: '07/04/2026', nota: 'Semana focada no avanço da implantação Daniela e preparação do review com Passagens. Meta pessoal: prospectar 2 novos contatos.' },
  },
];

// ─── AGENDA ──────────────────────────────────
export const COMPROMISSOS = [
  {
    id: 1,
    titulo: 'Review Quinzenal — Passagens Com Desconto',
    data: '2026-04-21',
    hora: '10:00',
    tipo: 'Reunião Cliente',
    descricao: 'Apresentar relatório de resultados do mês. Coletar feedback.',
  },
  {
    id: 2,
    titulo: 'Entrega: WhatsApp Daniela Acessórios',
    data: '2026-04-23',
    hora: '14:00',
    tipo: 'Entrega',
    descricao: 'Apresentação e teste do chatbot de atendimento com a cliente.',
  },
  {
    id: 3,
    titulo: 'Weekly de Projetos',
    data: '2026-04-14',
    hora: '09:00',
    tipo: 'Interna',
    descricao: 'Revisão semanal de todas as automações.',
  },
  {
    id: 4,
    titulo: 'Sessão de Portfólio — IA de Atendimento',
    data: '2026-04-18',
    hora: '16:00',
    tipo: 'Interna',
    descricao: 'Avançar na construção da IA de atendimento.',
  },
];

// ─── IDEIAS & BACKLOG ─────────────────────────
export const IDEIAS = [
  {
    id: 1,
    titulo: 'Chatbot para salões de beleza',
    tipo: 'Novo Cliente Alvo',
    categoria: 'Atendimento',
    prioridade: 'Alta',
    status: 'Ideia',
    descricao: 'Segmento enorme com alto volume de agendamentos e atendimentos via WhatsApp. Potencial de ticket médio igual ao atual.',
    proxPassos: 'Mapear dores commons. Criar pitch de prospecção. Testar com 1 salão piloto.',
  },
  {
    id: 2,
    titulo: 'Automação de pós-venda e recompra',
    tipo: 'Nova Automação',
    categoria: 'Prospecção',
    prioridade: 'Alta',
    status: 'Analisando',
    descricao: 'Envio automático de mensagem de follow-up após compra. Solicitar avaliação e oferecer desconto para recompra.',
    proxPassos: 'Especificar fluxo. Calcular custo de implementação. Oferecer para Daniela Acessórios.',
  },
  {
    id: 3,
    titulo: 'Dashboard de métricas para clientes',
    tipo: 'Nova Automação',
    categoria: 'Operacional',
    prioridade: 'Média',
    status: 'Analisando',
    descricao: 'Painel visual que o próprio cliente acessaria para ver as métricas das suas automações em tempo real.',
    proxPassos: 'Avaliar viabilidade técnica com React + Supabase. Estimar esforço.',
  },
  {
    id: 4,
    titulo: 'Prospecção automatizada via LinkedIn',
    tipo: 'Nova Automação',
    categoria: 'Prospecção',
    prioridade: 'Média',
    status: 'Desenvolvendo',
    descricao: 'Sequência automatizada de conexão e mensagem no LinkedIn para prospectar PMEs como clientes da Innohvasion.',
    proxPassos: 'Finalizar sequência de mensagens. Configurar ferramenta de automação. Testar com 50 contatos.',
  },
  {
    id: 5,
    titulo: 'Documentação interna de automações',
    tipo: 'Processo Interno',
    categoria: 'Operacional',
    prioridade: 'Baixa',
    status: 'Pronto',
    descricao: 'Criar um documento padrão (template) para registrar cada automação: objetivo, fluxo, stack, manutenção.',
    proxPassos: 'Template criado. Aplicar nas 3 automações portfólio existentes.',
  },
];

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
