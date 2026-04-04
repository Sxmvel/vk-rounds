import type { Atleta, Round, Confronto, ConfiguracaoTreino } from '../types';

const getChaveLuta = (id1: string, id2: string) => {
  return [id1, id2].sort().join('-');
};

export const gerarEscalaDeRounds = (
  atletas: Atleta[],
  config: ConfiguracaoTreino
): Round[] => {
  const rounds: Round[] = [];
  const { totalRounds, roundsSeparados } = config;

  const historicoLutas = new Map<string, number>();
  const historicoDescanso = new Map<string, number>();

  atletas.forEach(a => historicoDescanso.set(a.id, 0));

  for (let r = 1; r <= totalRounds; r++) {
    const isSeparado = r <= roundsSeparados;
    
    let disponiveis = [...atletas].sort(() => Math.random() - 0.5);

    // FIX DO TYPESCRIPT: Inicia estritamente como nulo, não undefined
    let descansando: Atleta | null = null; 

    if (disponiveis.length % 2 !== 0) {
      disponiveis.sort((a, b) => {
        if (isSeparado) {
           if (a.tipo === 'ALUNO' && b.tipo === 'PROFESSOR') return -1;
           if (a.tipo === 'PROFESSOR' && b.tipo === 'ALUNO') return 1;
        }
        return (historicoDescanso.get(a.id) || 0) - (historicoDescanso.get(b.id) || 0);
      });
      
      const removido = disponiveis.shift();
      if (removido) {
         descansando = removido; 
         historicoDescanso.set(descansando.id, (historicoDescanso.get(descansando.id) || 0) + 1);
      }
    }

    const confrontos: Confronto[] = [];

    while (disponiveis.length >= 2) {
      const atleta1 = disponiveis[0];
      
      let melhorOponenteIndex = 1;
      let menorPenalidade = Infinity;

      for (let i = 1; i < disponiveis.length; i++) {
        const atleta2 = disponiveis[i];
        const chaveLuta = getChaveLuta(atleta1.id, atleta2.id);
        const vezesLutaram = historicoLutas.get(chaveLuta) || 0;
        
        let repeticaoImediata = false;
        if (rounds.length > 0) {
          const ultimoRound = rounds[rounds.length - 1];
          repeticaoImediata = ultimoRound.confrontos.some(
            c => getChaveLuta(c.atleta1.id, c.atleta2.id) === chaveLuta
          );
        }

        let penalidade = vezesLutaram * 100;

        if (repeticaoImediata) {
          penalidade += 10000;
        }

        if (isSeparado) {
          if (atleta1.tipo !== atleta2.tipo) {
            penalidade += 5000;
          }
        }

        if (penalidade < menorPenalidade) {
          menorPenalidade = penalidade;
          melhorOponenteIndex = i;
        }
      }

      const atleta2 = disponiveis[melhorOponenteIndex];
      
      // FIX DO TYPESCRIPT: Adicionado cast para garantir que obedece a Interface
      confrontos.push({ atleta1, atleta2 } as Confronto);
      
      const chaveLuta = getChaveLuta(atleta1.id, atleta2.id);
      historicoLutas.set(chaveLuta, (historicoLutas.get(chaveLuta) || 0) + 1);

      disponiveis.splice(melhorOponenteIndex, 1); 
      disponiveis.splice(0, 1); 
    }

    // 🏆 REGRA NOVA: ORDENAR PROFESSORES PRIMEIRO
    confrontos.sort((a, b) => {
      const aTemProf = a.atleta1.tipo === 'PROFESSOR' || a.atleta2.tipo === 'PROFESSOR';
      const bTemProf = b.atleta1.tipo === 'PROFESSOR' || b.atleta2.tipo === 'PROFESSOR';
      
      if (aTemProf && !bTemProf) return -1; // Se A tem prof e B não, A vem primeiro
      if (!aTemProf && bTemProf) return 1;  // Se B tem prof e A não, B vem primeiro
      return 0; // Se ambos tem ou ambos não tem, mantém igual
    });

    rounds.push({
      numero: r,
      confrontos,
      // Se não tiver ninguém descansando, enviamos null
      descansando: descansando || undefined 
    } as Round);
  }

  return rounds;
};