// Constantes compartilhadas entre views

export const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Cartão', 'Transferência', 'Dinheiro'];

export const RECEBIMENTO_TIPOS = ['Implantação', 'Mensalidade', 'Consultoria', 'Outro'];
export const RECEBIMENTO_STATUS = ['Pendente', 'Pago', 'Atrasado', 'Cancelado'];

export const GASTO_CATEGORIAS = ['Ferramentas', 'Infraestrutura', 'Marketing', 'Pessoal', 'Operacional', 'Outro'];
export const GASTO_TIPOS = ['Fixo', 'Variável', 'Previsto', 'Eventual'];
export const GASTO_RECORRENCIAS = ['Único', 'Mensal', 'Anual', 'Trimestral'];
export const GASTO_STATUS = ['Pendente', 'Pago', 'Cancelado'];

export const STATUS_COLORS = {
  'Pendente': '#FBBF24',
  'Pago': '#00FFB2',
  'Atrasado': '#EF4444',
  'Cancelado': '#94A3B8'
};

// Estágio comercial do recebimento configurado direto na automação
export const COBRANCA_ESTAGIOS = ['Aguardando proposta', 'Proposta enviada', 'Pago', 'Parcelado'];
export const TIPO_COBRANCA = ['Implantação', 'Mensalidade', 'Ambos'];

// Mapeamento estágio comercial → status do recebimento
export const ESTAGIO_TO_STATUS = {
  'Aguardando proposta': 'Pendente',
  'Proposta enviada': 'Pendente',
  'Pago': 'Pago',
  'Parcelado': 'Pendente'
};
