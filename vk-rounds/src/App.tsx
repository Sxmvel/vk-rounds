import { useState } from 'react';
import { Button, Input, Radio, InputNumber, message } from 'antd';
import { Trash2 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { gerarEscalaDeRounds } from './core/engine';
import type { Atleta, Round, ConfiguracaoTreino } from './types';

export default function App() {
  const [atletas, setAtletas] = useLocalStorage<Atleta[]>('vk-atletas', []);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');
  const [config, setConfig] = useState<ConfiguracaoTreino>({
    totalRounds: 5,
    roundsSeparados: 2,
  });

  const handleAdd = () => {
    if (!nome.trim()) return;

    setAtletas([
      ...atletas,
      {
        id: crypto.randomUUID(),
        nome: nome.toUpperCase(),
        tipo,
      },
    ]);

    message.success('Atleta adicionado!');
    setNome('');
  };

  const handleRemove = (id: string) => {
    setAtletas(atletas.filter((a) => a.id !== id));
    message.info('Atleta removido');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050505] via-[#0A0A0A] to-black text-[#E5E5E5] font-mono p-6 lg:p-12">
      <div className="max-w-[1400px] mx-auto relative">

        {/* GLOW BACKGROUND */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600 opacity-10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600 opacity-10 blur-[120px] rounded-full" />

        {/* HEADER */}
        <header className="mb-16 border-b border-[#222] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white leading-none">
              VK.TEAM
            </h1>
            <p className="text-sm font-bold tracking-[0.4em] text-[#404040] uppercase">
              Rounds Management / Pro
            </p>
          </div>

          <div className="flex gap-8 border-l border-[#222] pl-8">
            <div className="text-center">
              <p className="text-[10px] mb-1 font-bold text-[#404040]">ROUNDS</p>
              <InputNumber
                variant="borderless"
                min={1}
                value={config.totalRounds}
                className="bg-[#121212] text-white font-bold w-16"
                onChange={(v) =>
                  setConfig({ ...config, totalRounds: v || 1 })
                }
              />
            </div>

            <div className="text-center">
              <p className="text-[10px] mb-1 font-bold text-[#404040]">SPLIT</p>
              <InputNumber
                variant="borderless"
                min={0}
                value={config.roundsSeparados}
                className="bg-[#121212] text-white font-bold w-16"
                onChange={(v) =>
                  setConfig({ ...config, roundsSeparados: v || 0 })
                }
              />
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-2 bg-[#121212] border border-[#222] rounded-xl overflow-hidden">

          {/* CADASTRO */}
          <div className="lg:col-span-4 p-8 border-r border-[#222] bg-[#0A0A0A]">
            <h2 className="text-xs font-bold mb-8 tracking-widest text-white uppercase">
              Inscrição
            </h2>

            <div className="space-y-6">
              <Input
                placeholder="NOME DO ATLETA"
                className="bg-[#0F0F0F] border border-[#333] h-14 text-white font-bold placeholder:text-[#444]
                focus:border-red-600 focus:shadow-[0_0_10px_rgba(255,0,0,0.3)] transition-all"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onPressEnter={handleAdd}
              />

              <Radio.Group
                block
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <Radio.Button className="h-12 w-1/2 text-center font-bold">
                  ALUNO
                </Radio.Button>
                <Radio.Button className="h-12 w-1/2 text-center font-bold">
                  PROFESSOR
                </Radio.Button>
              </Radio.Group>

              <Button
                block
                onClick={handleAdd}
                className="h-14 bg-white text-black font-black uppercase tracking-widest
                transition-all duration-300 hover:bg-red-600 hover:text-white hover:scale-[1.02]"
              >
                Adicionar
              </Button>
            </div>
          </div>

          {/* LISTA */}
          <div className="lg:col-span-8 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold tracking-widest text-[#404040] uppercase">
                {atletas.length} Atletas
              </h2>

              {atletas.length >= 2 && (
                <button
                  onClick={() =>
                    setRounds(gerarEscalaDeRounds(atletas, config))
                  }
                  className="bg-red-600 px-6 py-2 text-white font-black italic
                  shadow-[0_0_15px_rgba(255,0,0,0.4)]
                  hover:shadow-[0_0_25px_rgba(255,0,0,0.6)]
                  transition-all duration-300"
                >
                  GERAR COMBATES
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {atletas.map((a) => (
                <div
                  key={a.id}
                  className="bg-[#1A1A1A] p-4 flex justify-between items-center
                  border border-[#222] hover:border-red-600
                  hover:shadow-[0_0_20px_rgba(255,0,0,0.15)]
                  transition-all duration-300 rounded-lg"
                >
                  <div>
                    <p className="text-[10px] text-red-600 font-bold mb-1">
                      {a.tipo}
                    </p>
                    <p className="text-sm font-black">{a.nome}</p>
                  </div>

                  <Trash2
                    size={16}
                    className="cursor-pointer hover:text-red-500"
                    onClick={() => handleRemove(a.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ROUNDS */}
        {rounds.length > 0 && (
          <div className="mt-16">
            <h2 className="text-center font-black italic text-4xl mb-12">
              COMBATES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rounds.map((r) => (
                <div
                  key={r.numero}
                  className="bg-[#121212] border-t-4 border-red-600 p-6
                  shadow-[0_0_30px_rgba(255,0,0,0.1)]
                  hover:scale-[1.02] transition-all duration-300 rounded-lg"
                >
                  <h3 className="font-black text-xl mb-6">
                    ROUND #{r.numero}
                  </h3>

                  <div className="space-y-3">
                    {r.confrontos.map((l) => (
                      <div
                        key={l.id}
                        className="bg-[#0D0D0D] p-3 border border-[#222]
                        hover:border-red-600 transition-all rounded"
                      >
                        <div className="flex justify-between text-sm font-black">
                          <span>{l.atleta1.nome}</span>
                          <span className="text-red-600 animate-pulse">
                            VS
                          </span>
                          <span>{l.atleta2.nome}</span>
                        </div>
                      </div>
                    ))}

                    {r.descansando && (
                      <div className="bg-white text-black text-center p-2 rounded">
                        DESCANSO: {r.descansando.nome}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}