export interface PartData {
  veiculo: string;
  codInterno: string;
  codFreiocar: string;
  modelo: string;
  aplicacao: string;
  dimA: string;
  dimB: string;
  dimC: string;
  dimD: string;
  lado: string;
  icms17: string;
  icms12: string;
  icms7: string;
}

export interface KitItemData {
  veiculo?: string;
  tipoItem: string;
  codInterno: string;
  codFreiocar: string;
  descricao: string;
  icms17: string;
  icms12: string;
  icms7: string;
  found: boolean;
}

export interface Kit3EixoData {
  veiculo: string;
  tipo: string;
  codInterno: string;
  codFreiocar: string;
  descricao: string;
  qtdPadrao: number;
  valor: string;
  configuracao: string;
}

export interface AdaptacaoData {
  nSerie: string;
  notaFiscal: string;
  dataFabricacao: string;
  certCardan: string;
  certGarantia: string;
  modeloCaminhao: string;
  pbt: string;
  codProduto: string;
  descProduto: string;
  rastFlange: string;
  ponteira: string;
  rastTubo: string;
  concessionaria: string;
  pedido: string;
  op: string;
}

export interface CardanData {
  modelo: string;
  veiculo: string;
  codInterno: string;
  medTubo: string;
  pecas: string;
  cruzeta: string;
  medCruzeta: string;
  observacoes: string;
  valor: string;
}

export interface UserCredential {
  usuario: string;
  senha: string;
  tipo: 'Cardancorp' | 'Concessionaria' | 'Representante' | 'Desconhecido';
}

export interface CartItem {
  id: string; // codInterno ou identificador unico
  codInterno: string;
  codFreiocar: string;
  descricao: string;
  valorUnitario: number;
  quantidade: number;
  tipo: 'catraca' | 'kit' | 'kit3eixo';
  origemIcms?: string; // Para validação de regra (ex: icms17)
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface SheetConfig {
  url: string;
}