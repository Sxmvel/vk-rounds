import type { Atleta, Round, Confronto, ConfiguracaoTreino } from '../types';

export const gerarEscalaDeRounds = (
  atletas: Atleta[],
  config: ConfiguracaoTreino
): Round[] => {
  const rounds: Round[] = [];

  // Matriz de histórico: Quantas vezes o AtletaA lutou contra o AtletaB
  const historicoLutas = new Map<string, Map<string, number>>();
  // Controle de descanso: Quantas vezes o atleta já ficou de fora
  const descansos = new Map<string, number>();

  // Inicializando as estruturas de controle
  atletas.forEach(a => {
    historicoLutas.set(a.id, new Map<string, number>());
    descansos.set(a.id, 0);
  });

  const getLutas = (id1: string, id2: string) => historicoLutas.get(id1)?.get(id2) || 0;
  const registrarLuta = (a1: Atleta, a2: Atleta) => {
    const hist1 = historicoLutas.get(a1.id)!;
    const hist2 = historicoLutas.get(a2.id)!;
    hist1.set(a2.id, (hist1.get(a2.id) || 0) + 1);
    hist2.set(a1.id, (hist2.get(a1.id) || 0) + 1);
  };

  // Função para achar o melhor oponente (quem lutou menos vezes)
  const acharMelhorOponente = (lutador: Atleta, candidatos: Atleta[]): Atleta => {
    return candidatos.sort((a, b) => getLutas(lutador.id, a.id) - getLutas(lutador.id, b.id))[0];
  };

  for (let r = 1; r <= config.totalRounds; r++) {
    const ehFaseSeparada = r <= config.roundsSeparados;
    const confrontosDoRound: Confronto[] = [];
    let descansando: Atleta | null = null;
    let disponiveis = [...atletas];

    // --- REGRA 1: QUEM DESCANSA? (Ímpar) ---
    if (disponiveis.length % 2 !== 0) {
      const alunos = disponiveis.filter(a => a.tipo === 'ALUNO');

      if (alunos.length > 0) {
        // Ordena alunos para quem descansou MENOS ser o escolhido
        alunos.sort((a, b) => descansos.get(a.id)! - descansos.get(b.id)!);
        descansando = alunos[0];
      } else {
        // Safety net matemática: se tiver 3 professores e 0 alunos, a física exige que alguém descanse
        disponiveis.sort((a, b) => descansos.get(a.id)! - descansos.get(b.id)!);
        descansando = disponiveis[0];
      }

      // Remove o descansando da lista de disponíveis do round
      disponiveis = disponiveis.filter(a => a.id !== descansando!.id);
      descansos.set(descansando!.id, descansos.get(descansando!.id)! + 1);
    }

    // Separa os disponíveis do round por hierarquia
    let profsDisponiveis = disponiveis.filter(a => a.tipo === 'PROFESSOR');
    let alunosDisponiveis = disponiveis.filter(a => a.tipo === 'ALUNO');

    // --- REGRA 2: PROFESSORES SÃO PRIORIDADE E NUNCA PARAM ---
    while (profsDisponiveis.length > 0) {
      const p1 = profsDisponiveis.shift()!; // Pega o primeiro professor
      let oponente: Atleta;

      if (ehFaseSeparada) {
        if (profsDisponiveis.length > 0) {
          // Tem outro professor para lutar? Puxa ele.
          oponente = acharMelhorOponente(p1, profsDisponiveis);
          profsDisponiveis = profsDisponiveis.filter(p => p.id !== oponente.id);
        } else {
          // Professor sobrou na fase separada? Quebra a regra e puxa um aluno!
          oponente = acharMelhorOponente(p1, alunosDisponiveis);
          alunosDisponiveis = alunosDisponiveis.filter(a => a.id !== oponente.id);
        }
      } else {
        // Fase Mista: O professor pode pegar qualquer um (professor ou aluno)
        const todosRestantes = [...profsDisponiveis, ...alunosDisponiveis];
        oponente = acharMelhorOponente(p1, todosRestantes);

        // Remove de onde ele foi puxado
        profsDisponiveis = profsDisponiveis.filter(p => p.id !== oponente.id);
        alunosDisponiveis = alunosDisponiveis.filter(a => a.id !== oponente.id);
      }

      registrarLuta(p1, oponente);
      confrontosDoRound.push({ id: crypto.randomUUID(), atleta1: p1, atleta2: oponente });
    }

    // --- REGRA 3: ALUNOS QUE SOBRARAM LUTAM ENTRE SI ---
    while (alunosDisponiveis.length > 0) {
      const a1 = alunosDisponiveis.shift()!;
      const oponente = acharMelhorOponente(a1, alunosDisponiveis);
      alunosDisponiveis = alunosDisponiveis.filter(a => a.id !== oponente.id);

      registrarLuta(a1, oponente);
      confrontosDoRound.push({ id: crypto.randomUUID(), atleta1: a1, atleta2: oponente });
    }

    rounds.push({ numero: r, confrontos: confrontosDoRound, descansando });
  }

  return rounds;
};