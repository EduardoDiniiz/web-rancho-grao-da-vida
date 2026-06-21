import { maskCpfCnpj, maskPhone } from './masks';

/** Formata CPF/CNPJ (armazenado como digitos) para exibicao. */
export function formatCpfCnpj(value?: string | null): string {
  return value ? maskCpfCnpj(value) : '-';
}

/** Formata telefone (armazenado como digitos) para exibicao. */
export function formatPhone(value?: string | null): string {
  return value ? maskPhone(value) : '-';
}

export function formatCurrency(value?: number | null): string {
  if (value == null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  // espera ISO yyyy-MM-dd (ou data-hora) e formata como dd/MM/yyyy
  const datePart = value.substring(0, 10);
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

const LABELS: Record<string, string> = {
  // Sexo
  MACHO: 'Macho', FEMEA: 'Fêmea',
  // Esporte
  VAQUEJADA: 'Vaquejada', TRES_TAMBORES: 'Três Tambores', HIPISMO: 'Hipismo',
  CORRIDA: 'Corrida', OUTRO: 'Outro',
  // Status animal/baia/hospedagem/contrato/pagamento
  ATIVO: 'Ativo', ARQUIVADO: 'Arquivado', LIVRE: 'Livre', OCUPADA: 'Ocupada',
  MANUTENCAO: 'Manutenção', ENCERRADO: 'Encerrado', SUSPENSO: 'Suspenso',
  PENDENTE: 'Pendente', PAGO: 'Pago', ATRASADO: 'Atrasado', CANCELADO: 'Cancelado',
  EM_DIA: 'Em dia', PROXIMA: 'Próxima do vencimento', VENCIDA: 'Vencida',
  // Perfis
  ADMIN: 'Administrador', OPERADOR: 'Operador',
  // Forma de pagamento
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito', TRANSFERENCIA: 'Transferência',
  BOLETO: 'Boleto',
};

export function label(value?: string | null): string {
  if (!value) return '-';
  return LABELS[value] ?? value;
}
