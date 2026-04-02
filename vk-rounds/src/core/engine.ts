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

  // NOVA LÓGICA COM ALEATORIEDADE:
  const acharMelhorOponente = (lutador: Atleta, candidatos: Atleta[]): Atleta => {
    // 1. Embaralha os candidatos (fator caos para gerar sequências diferentes)
    const candidatosEmbaralhados = [...candidatos].sort(() => Math.random() - 0.5);
    
    // 2. Ordena baseado no histórico (matemática das repetições)
    return candidatosEmbaralhados.sort((a, b) => getLutas(lutador.id, a.id) - getLutas(lutador.id, b.id))[0];
  };

  for (let r = 1; r <= config.totalRounds; r++) {
    const ehFaseSeparada = r <= config.roundsSeparados;
    const confrontosDoRound: Confronto[] = [];
    let descansando: Atleta | null = null;
    let disponiveis = [...atletas];

    if (disponiveis.length % 2 !== 0) {
      const alunos = disponiveis.filter(a => a.tipo === 'ALUNO');
      
      if (alunos.length > 0) {
        // Ordena alunos pelo descanso, usando aleatoriedade para desempate
        alunos.sort((a, b) => {
            const diff = descansos.get(a.id)! - descansos.get(b.id)!;
            return diff === 0 ? Math.random() - 0.5 : diff;
        });
        descansando = alunos[0];
      } else {
        disponiveis.sort((a, b) => {
            const diff = descansos.get(a.id)! - descansos.get(b.id)!;
            return diff === 0 ? Math.random() - 0.5 : diff;
        });
        descansando = disponiveis[0];
      }
      
      disponiveis = disponiveis.filter(a => a.id !== descansando!.id);
      descansos.set(descansando!.id, descansos.get(descansando!.id)! + 1);
    }

    // A partir daqui, embaralhamos quem começa escolhendo para não ser sempre a mesma ordem
    let profsDisponiveis = disponiveis.filter(a => a.tipo === 'PROFESSOR').sort(() => Math.random() - 0.5);
    let alunosDisponiveis = disponiveis.filter(a => a.tipo === 'ALUNO').sort(() => Math.random() - 0.5);

    while (profsDisponiveis.length > 0) {
      const p1 = profsDisponiveis.shift()!;
      let oponente: Atleta;

      if (ehFaseSeparada) {
        if (profsDisponiveis.length > 0) {
          oponente = acharMelhorOponente(p1, profsDisponiveis);
          profsDisponiveis = profsDisponiveis.filter(p => p.id !== oponente.id);
        } else {
          oponente = acharMelhorOponente(p1, alunosDisponiveis);
          alunosDisponiveis = alunosDisponiveis.filter(a => a.id !== oponente.id);
        }
      } else {
        const todosRestantes = [...profsDisponiveis, ...alunosDisponiveis];
        oponente = acharMelhorOponente(p1, todosRestantes);
        profsDisponiveis = profsDisponiveis.filter(p => p.id !== oponente.id);
        alunosDisponiveis = alunosDisponiveis.filter(a => a.id !== oponente.id);
      }

      registrarLuta(p1, oponente);
      confrontosDoRound.push({ id: crypto.randomUUID(), atleta1: p1, atleta2: oponente });
    }

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