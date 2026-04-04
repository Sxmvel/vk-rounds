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

    let descansando: Atleta | undefined = undefined;

    // 🛑 REGRA ESSENCIAL: PROFESSOR NÃO DESCANSA
    if (disponiveis.length % 2 !== 0) {
      // Filtramos apenas os alunos que estão disponíveis para o descanso
      const alunosParaPausar = disponiveis.filter(a => a.tipo === 'ALUNO');
      
      if (alunosParaPausar.length > 0) {
        // Ordena os alunos por quem descansou menos vezes no total
        alunosParaPausar.sort((a, b) => (historicoDescanso.get(a.id) || 0) - (historicoDescanso.get(b.id) || 0));
        
        const escolhidoParaDescansar = alunosParaPausar[0];
        descansando = escolhidoParaDescansar;

        // Remove o aluno escolhido da lista de quem vai lutar neste round
        const indexNoOriginal = disponiveis.findIndex(a => a.id === escolhidoParaDescansar.id);
        disponiveis.splice(indexNoOriginal, 1);

        // Registra o descanso no histórico
        historicoDescanso.set(escolhidoParaDescansar.id, (historicoDescanso.get(escolhidoParaDescansar.id) || 0) + 1);
      } else {
        // Caso extremo: Se SÓ houver professores e o número for ímpar, 
        // alguém terá que pausar (ou lutaria sozinho), mas priorizamos o primeiro.
        const removido = disponiveis.shift();
        if (removido) descansando = removido;
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
        if (repeticaoImediata) penalidade += 10000;
        if (isSeparado && atleta1.tipo !== atleta2.tipo) penalidade += 5000;

        if (penalidade < menorPenalidade) {
          menorPenalidade = penalidade;
          melhorOponenteIndex = i;
        }
      }

      const atleta2 = disponiveis[melhorOponenteIndex];
      confrontos.push({ atleta1, atleta2 } as Confronto);
      
      const chaveLuta = getChaveLuta(atleta1.id, atleta2.id);
      historicoLutas.set(chaveLuta, (historicoLutas.get(chaveLuta) || 0) + 1);

      disponiveis.splice(melhorOponenteIndex, 1); 
      disponiveis.splice(0, 1); 
    }

    // 🏆 ORDENAR PROFESSORES NAS PRIMEIRAS LUTAS (Luta 1, 2...)
    confrontos.sort((a, b) => {
      const aTemProf = a.atleta1.tipo === 'PROFESSOR' || a.atleta2.tipo === 'PROFESSOR';
      const bTemProf = b.atleta1.tipo === 'PROFESSOR' || b.atleta2.tipo === 'PROFESSOR';
      if (aTemProf && !bTemProf) return -1;
      if (!aTemProf && bTemProf) return 1;
      return 0;
    });

    rounds.push({
      numero: r,
      confrontos,
      descansando
    } as Round);
  }

  return rounds;
};