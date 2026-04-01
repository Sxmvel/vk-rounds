import type { Atleta, Round, Confronto, ConfiguracaoTreino } from '../types';

export const gerarEscalaDeRounds = (
  atletas: Atleta[],
  config: ConfiguracaoTreino
): Round[] => {
  const rounds: Round[] = [];
  
  // Histórico para evitar repetições: Map<AtletaID, Set<OponenteID>>
  const historicoLutas = new Map<string, string[]>();
  
  // Inicializa contadores de descanso e rounds
  const roundsLutados = new Map<string, number>();
  atletas.forEach(a => {
    historicoLutas.set(a.id, []);
    roundsLutados.set(a.id, 0);
  });

  for (let r = 1; r <= config.totalRounds; r++) {
    const ehFaseSeparada = r <= config.roundsSeparados;
    let disponiveis = [...atletas];
    const confrontosDoRound: Confronto[] = [];
    let descansando: Atleta | null = null;

    // 1. Lógica de Descanso (se ímpar ou rotatividade)
    if (disponiveis.length % 2 !== 0) {
      // Prioridade de descanso para quem mais lutou ou sorteio justo
      disponiveis.sort((a, b) => (roundsLutados.get(b.id) || 0) - (roundsLutados.get(a.id) || 0));
      descansando = disponiveis.shift()!;
    }

    // 2. Embaralhar para garantir aleatoriedade inicial
    disponiveis = disponiveis.sort(() => Math.random() - 0.5);

    // 3. Matching
    while (disponiveis.length >= 2) {
      const a1 = disponiveis.shift()!;
      
      // Encontrar o melhor parceiro para a1
      const parceiroIndex = disponiveis.findIndex(a2 => {
        const mesmaCat = a1.tipo === a2.tipo;
        const jaLutaram = historicoLutas.get(a1.id)?.includes(a2.id);
        
        if (ehFaseSeparada) {
          return mesmaCat && !jaLutaram;
        }
        return !jaLutaram;
      });

      // Se não achou parceiro ideal (que não lutou), pega o primeiro disponível (fallback)
      const finalIndex = parceiroIndex !== -1 ? parceiroIndex : 0;
      const a2 = disponiveis.splice(finalIndex, 1)[0];

      // Registrar Luta
      confrontosDoRound.push({
        id: `${r}-${a1.id}-${a2.id}`,
        atleta1: a1,
        atleta2: a2
      });

      // Atualizar Histórico
      historicoLutas.get(a1.id)?.push(a2.id);
      historicoLutas.get(a2.id)?.push(a1.id);
      roundsLutados.set(a1.id, (roundsLutados.get(a1.id) || 0) + 1);
      roundsLutados.set(a2.id, (roundsLutados.get(a2.id) || 0) + 1);
    }

    rounds.push({
      numero: r,
      confrontos: confrontosDoRound,
      descansando: descansando || null
    });
  }

  return rounds;
};