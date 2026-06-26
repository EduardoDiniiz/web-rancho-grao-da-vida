export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type Role = 'ADMIN' | 'OPERADOR';

export interface AuthResponse {
  token: string;
  type: string;
  expiresIn: number;
  userId: number;
  name: string;
  role: Role;
}

export interface User {
  id: number;
  name: string;
  email: string;
  login: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  active: boolean;
  totalAnimais: number;
  createdAt: string;
}

export type Sexo = 'MACHO' | 'FEMEA';
export type Esporte = 'VAQUEJADA' | 'TRES_TAMBORES' | 'HIPISMO' | 'CORRIDA' | 'OUTRO';
export type AnimalStatus = 'ATIVO' | 'ARQUIVADO';

export interface Animal {
  id: number;
  clienteId: number;
  clienteNome: string;
  nome: string;
  dataNascimento?: string;
  sexo?: Sexo;
  esporte?: Esporte;
  registro?: string;
  enfermidades?: string;
  observacoes?: string;
  status: AnimalStatus;
}

export interface Vacina {
  id: number;
  animalId: number;
  animalNome: string;
  nome: string;
  dataAplicacao: string;
  dataVencimento?: string;
  observacao?: string;
  situacao: 'EM_DIA' | 'PROXIMA' | 'VENCIDA';
}

export interface Exame {
  id: number;
  animalId: number;
  animalNome: string;
  nome: string;
  data: string;
  resultado?: string;
  veterinario?: string;
  observacao?: string;
}

export type BaiaStatus = 'LIVRE' | 'OCUPADA' | 'MANUTENCAO';

export interface Baia {
  id: number;
  identificacao: string;
  localizacao?: string;
  capacidade: number;
  status: BaiaStatus;
  observacao?: string;
  animalAtual?: string;
}

export type HospedagemStatus = 'ATIVO' | 'ENCERRADO';

export interface Hospedagem {
  id: number;
  animalId: number;
  animalNome: string;
  clienteId: number;
  clienteNome: string;
  baiaId: number;
  baiaIdentificacao: string;
  dataEntrada: string;
  dataSaida?: string;
  status: HospedagemStatus;
}

export interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  valorPadrao: number;
  active: boolean;
}

export type AnimalServicoStatus = 'ATIVO' | 'SUSPENSO' | 'ENCERRADO';

export interface AnimalServico {
  id: number;
  animalId: number;
  animalNome: string;
  servicoId: number;
  servicoNome: string;
  valor: number;
  dataInicio: string;
  proximoVencimento?: string;
  recorrenciaDias: number;
  descricao?: string;
  status: AnimalServicoStatus;
}

export type PagamentoStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
export type FormaPagamento =
  | 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO'
  | 'TRANSFERENCIA' | 'BOLETO' | 'OUTRO';

export interface Pagamento {
  id: number;
  animalServicoId?: number;
  animalId?: number;
  animalNome?: string;
  clienteId?: number;
  clienteNome?: string;
  servicoNome?: string;
  descricao?: string;
  valor: number;
  vencimento: string;
  dataPagamento?: string;
  formaPagamento?: FormaPagamento;
  status: PagamentoStatus;
}

export interface Dispositivo {
  id: string;
  nome: string;
  categoria?: string;
  online?: boolean;
  ligado?: boolean;
  switchCode?: string;
  horaLigar?: string;
  horaDesligar?: string;
  agendamentoAtivo?: boolean;
}

export interface DispositivosResponse {
  configured: boolean;
  dispositivos: Dispositivo[];
}

export interface DashboardResumo {
  totalAReceber: number;
  totalRecebidoMes: number;
  cobrancasVencidas: number;
  animaisHospedados: number;
  baiasOcupadas: number;
  baiasLivres: number;
  baiasManutencao: number;
  totalClientes: number;
}
