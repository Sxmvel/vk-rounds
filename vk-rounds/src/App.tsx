import { useState } from 'react';
import { Button, Input, Select, message, ConfigProvider, theme, Modal } from 'antd';
import { useLocalStorage } from './hooks/useLocalStorage';
import { gerarEscalaDeRounds } from './core/engine';
import type { Atleta, Round, ConfiguracaoTreino } from './types';

export default function App() {
  const [atletas, setAtletas] = useLocalStorage<Atleta[]>('vk-atletas', []);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');
  const [config, setConfig] = useState<ConfiguracaoTreino>({ totalRounds: 8, roundsSeparados: 4 });
  const [atletaFocoId, setAtletaFocoId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!nome.trim()) return;
    setAtletas([...atletas, { id: crypto.randomUUID(), nome: nome.toUpperCase(), tipo }]);
    setNome('');
    setRounds([]);
  };

  const handleGerar = () => {
    if (atletas.length < 2) return message.warning("Adicione pelo menos 2 atletas.");
    setRounds(gerarEscalaDeRounds(atletas, config));
  };

  const handleReset = () => {
    if (window.confirm("Isso apagará todos os atletas do tatame. Tem certeza?")) {
      setAtletas([]);
      setRounds([]);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const maxCombates = rounds.length > 0 ? Math.max(...rounds.map(r => r.confrontos.length)) : 0;
  const colunasCombate = Array.from({ length: maxCombates }, (_, i) => i + 1);

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#38b000', colorBgContainer: '#121212', colorBorder: '#333' } }}>
      <div className="flex justify-center items-center h-screen w-full bg-black overflow-hidden print-expand">

        {/* O APARELHO (CANVAS) */}
        <div
          className="relative shadow-2xl print-expand bg-canvas"
          style={{
            width: '100%', height: '100%', maxHeight: '100vh', maxWidth: 'calc(100vh * (1080 / 1920))',
            aspectRatio: '1080 / 1920',
            backgroundImage: `url('${import.meta.env.BASE_URL}bg-app.png')`,
            backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
          }}
        >
          {/* SAFE AREA (Ajustada para o Header Fixo) */}
          <div
            className="absolute flex flex-col print-expand"
            style={{
              left: '15.277%', width: '69.444%', top: '10.937%', height: '78.125%',
              padding: '6% 5% 8% 5%'
            }}
          >
            {/* 📍 CABEÇALHO FIXO (Nunca some) */}
            <div className="text-center pb-2 border-b border-[#333] shrink-0">
              <h1 className="text-lg md:text-xl font-black text-gray-200 drop-shadow-md tracking-widest uppercase italic leading-tight">
                VK TEAM <br /><span className="text-gray-500 text-sm md:text-base">ROUNDS</span>
              </h1>
            </div>

            {/* 📜 CONTEÚDO ROLÁVEL */}
            <div className="flex-1 overflow-y-auto hide-scroll flex flex-col gap-3 pt-3 print-expand">

              <div className="bg-[#111]/90 p-2 rounded-lg border border-[#333] flex justify-between items-center print-hide">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">Rounds Total</span>
                  <Select size="small" value={config.totalRounds} onChange={v => setConfig({ ...config, totalRounds: v })} className="w-14 font-bold">
                    {[4, 6, 8, 10, 12].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
                  </Select>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">Separados</span>
                  <Select size="small" value={config.roundsSeparados} onChange={v => setConfig({ ...config, roundsSeparados: v })} className="w-14 font-bold">
                    {[0, 1, 2, 3, 4, 5, 6].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
                  </Select>
                </div>
              </div>

              <div className="bg-[#111]/90 p-2 rounded-lg border border-[#333] flex flex-col gap-2 print-hide">
                <Input placeholder="NOME DO ATLETA" className="font-bold text-xs uppercase text-center" value={nome} onChange={e => setNome(e.target.value)} onPressEnter={handleAdd} />
                <div className="flex gap-2">
                  <Select value={tipo} onChange={setTipo} className="flex-1 font-bold text-[10px]">
                    <Select.Option value="ALUNO">Aluno</Select.Option>
                    <Select.Option value="PROFESSOR">Prof</Select.Option>
                  </Select>
                  <Button type="primary" onClick={handleAdd} className="font-bold text-[10px] border-none flex-1 shadow-md">
                    INSCREVER
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 h-36 print-hide">
                <div className="flex-1 border border-[#333] rounded bg-[#161616] flex flex-col overflow-hidden">
                  <div className="text-center py-1 text-[8px] text-gray-300 font-black uppercase bg-[#222]">Alunos</div>
                  <div className="flex-1 overflow-y-auto p-1 hide-scroll">
                    {atletas.filter(a => a.tipo === 'ALUNO').map(a => (
                      <div key={a.id} className="flex justify-between items-center py-1 px-1 border-b border-[#222]">
                        <span className="text-[9px] text-gray-300 font-bold truncate max-w-[80%]">{a.nome}</span>
                        <button onClick={() => setAtletas(atletas.filter(x => x.id !== a.id))} className="text-gray-500 hover:text-red-500 font-bold text-[10px]">X</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 border border-[#444] rounded bg-[#161616] flex flex-col overflow-hidden">
                  <div className="text-center py-1 text-[8px] text-gray-200 font-black uppercase bg-[#222]">Professores</div>
                  <div className="flex-1 overflow-y-auto p-1 hide-scroll">
                    {atletas.filter(a => a.tipo === 'PROFESSOR').map(a => (
                      <div key={a.id} className="flex justify-between items-center py-1 px-1 border-b border-[#222]">
                        <span className="text-[9px] text-gray-300 font-bold truncate max-w-[80%]">{a.nome}</span>
                        <button onClick={() => setAtletas(atletas.filter(x => x.id !== a.id))} className="text-gray-500 hover:text-red-500 font-bold text-[10px]">X</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 print-hide">
                {atletas.length >= 2 && (
                  <button onClick={handleGerar} className="btn-generate-green w-full py-2 text-[10px] shadow-md">
                    GERAR ESCALA DE ROUNDS
                  </button>
                )}
                <button onClick={handleReset} className="btn-danger-fosco w-full py-1.5 text-[9px]">
                  LIMPAR TATAME
                </button>
              </div>

              {/* TABELA E PDF */}
              {rounds.length > 0 && (
                <div className="mt-2 border-t border-[#333] pt-3 animate-in fade-in">

                  {/* BARRA DE BUSCA INDIVIDUAL */}
                  <div className="bg-[#111] p-2 rounded-lg border border-[#333] mb-3 flex flex-col items-center print-hide">
                    <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">Buscar minhas lutas:</span>
                    <Select
                      showSearch
                      placeholder="Selecione seu nome..."
                      className="w-full font-bold uppercase"
                      onChange={(id) => setAtletaFocoId(id)}
                      value={null}
                      filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
                      options={atletas.map(a => ({ value: a.id, label: a.nome }))}
                    />
                  </div>

                  <h3 className="text-center font-black text-gray-400 mb-2 text-[9px] uppercase tracking-widest print:text-black">Ordem de Combate</h3>

                  <div className="overflow-x-auto pb-2 hide-scroll print-expand">
                    <table className="vk-table w-full shadow-lg">
                      <thead>
                        <tr>
                          <th>R</th>
                          {colunasCombate.map(num => <th key={num}>LUTA {num}</th>)}
                          <th className="text-gray-500 print:text-black">PAUSA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rounds.map(r => (
                          <tr key={r.numero}>
                            <td className="font-black bg-[#222] text-white text-[10px] print:bg-gray-200 print:text-black">{r.numero}</td>
                            {colunasCombate.map(num => {
                              const luta = r.confrontos[num - 1];
                              return (
                                <td key={num} className="whitespace-nowrap">
                                  {luta ? (
                                    <span className="text-[9px] font-bold text-gray-300 print:text-black">
                                      {luta.atleta1.nome} <span className="text-gray-600 italic mx-0.5">v</span> {luta.atleta2.nome}
                                    </span>
                                  ) : <span className="text-gray-700">-</span>}
                                </td>
                              );
                            })}
                            <td className="text-[8px] font-bold text-gray-500 bg-[#111] whitespace-nowrap print:bg-white print:text-black">
                              {r.descansando ? r.descansando.nome : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* BOTOES FINAIS */}
                  <div className="flex flex-col gap-2 mt-3 pb-4 print-hide">
                    <button onClick={handleGerar} className="btn-generate-blue w-full py-2.5 text-[10px]">
                      NOVA SEQUÊNCIA
                    </button>
                    <button onClick={handleExport} className="btn-secondary-fosco w-full py-2 text-[9px]">
                      EXPORTAR PDF
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE FOCO DO ATLETA (CARTEL) */}
      <Modal
        open={!!atletaFocoId}
        onCancel={() => setAtletaFocoId(null)}
        footer={null}
        centered
        closeIcon={<span className="text-white font-bold text-lg hover:text-red-500">X</span>}
        styles={{
          body: { backgroundColor: '#111', padding: '16px' },
          header: { backgroundColor: '#111', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '12px' }
        }}
        title={
          <div className="text-center w-full uppercase font-black text-white italic text-lg tracking-widest">
            {atletas.find(a => a.id === atletaFocoId)?.nome}
          </div>
        }
      >
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto hide-scroll">
          {rounds.map(r => {
            const luta = r.confrontos.find(c => c.atleta1.id === atletaFocoId || c.atleta2.id === atletaFocoId);
            const pausado = r.descansando?.id === atletaFocoId;

            if (!luta && !pausado) return null;

            const adversario = luta?.atleta1.id === atletaFocoId ? luta?.atleta2.nome : luta?.atleta1.nome;

            return (
              <div key={r.numero} className="flex justify-between items-center bg-[#1a1a1a] border border-[#333] rounded-md p-3">
                <span className="font-black text-gray-400 text-xs">R{r.numero}</span>
                {pausado ? (
                  <span className="font-black text-red-500 uppercase tracking-widest text-sm">Pausa</span>
                ) : (
                  <span className="font-bold text-gray-200 text-sm">
                    vs <span className="font-black text-[#38b000] text-base uppercase">{adversario}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Modal>

    </ConfigProvider>
  );
}