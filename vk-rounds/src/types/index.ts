export type Categoria = 'ALUNO' | 'PROFESSOR';

export interface Atleta {
  id: string;
  nome: string;
  tipo: Categoria;
}

export interface Confronto {
  id: string;
  atleta1: Atleta;
  atleta2: Atleta;
}

export interface Round {
  numero: number;
  confrontos: Confronto[];
  descansando: Atleta | null;
}

export interface ConfiguracaoTreino {
  totalRounds: number;
  roundsSeparados: number; 
}