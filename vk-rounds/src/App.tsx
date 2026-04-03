import { useState } from 'react';
import { Button, Input, Select, message, ConfigProvider, theme } from 'antd';
import { useLocalStorage } from './hooks/useLocalStorage';
import { gerarEscalaDeRounds } from './core/engine';
import type { Atleta, Round, ConfiguracaoTreino } from './types';

export default function App() {
  const [atletas, setAtletas] = useLocalStorage<Atleta[]>('vk-atletas', []);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');
  const [config, setConfig] = useState<ConfiguracaoTreino>({ totalRounds: 8, roundsSeparados: 4 });

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
      
      {/* Contêiner Pai: Fundo Preto Absoluto para o que sobrar da tela */}
      <div className="flex justify-center items-center h-screen w-full bg-black overflow-hidden">
        
        {/* O APARELHO (CANVAS): 
          Aqui está a mágica. Forçamos o contêiner a ter EXATAMENTE a proporção 1080x1920.
          O calc() impede que a imagem dê "zoom" e corte as logos laterais.
        */}
        <div 
          className="relative shadow-2xl"
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '100vh',
            maxWidth: 'calc(100vh * (1080 / 1920))', // Mantém a proporção exata sem cortar
            aspectRatio: '1080 / 1920',
            backgroundImage: `url('${import.meta.env.BASE_URL}bg-app.png')`,
            backgroundSize: '100% 100%', // Estica milimetricamente na proporção da div
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          
          {/* SAFE AREA (TATAME CENTRAL): 
            Usando a sua matemática: X=165px (15.277%), Y=210px (10.937%), W=750px (69.444%), H=1500px (78.125%)
          */}
          <div 
            className="absolute flex flex-col hide-scroll"
            style={{
              left: '15.277%',   
              width: '69.444%',  
              top: '10.937%',    
              height: '78.125%', 
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            
            {/* CONTEÚDO DA SAFE AREA */}
            <div className="flex flex-col gap-3 p-1 min-h-full">
              
              {/* TÍTULO DE VOLTA E CENTRALIZADO */}
              <div className="text-center pb-2 border-b border-[#333] pt-2">
                <h1 className="text-lg md:text-xl font-black text-gray-200 drop-shadow-md tracking-widest uppercase italic leading-tight">
                  VK TEAM <br/><span className="text-gray-500 text-sm md:text-base">ROUNDS</span>
                </h1>
              </div>
              
              {/* CONFIGURAÇÕES DE ROUND */}
              <div className="bg-[#111]/90 p-2 rounded-lg border border-[#333] flex justify-between items-center mt-1">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">Rounds Total</span>
                  <Select size="small" value={config.totalRounds} onChange={v => setConfig({...config, totalRounds: v})} className="w-14 font-bold">
                    {[4,6,8,10,12].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
                  </Select>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">Separados</span>
                  <Select size="small" value={config.roundsSeparados} onChange={v => setConfig({...config, roundsSeparados: v})} className="w-14 font-bold">
                    {[0,1,2,4,6].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
                  </Select>
                </div>
              </div>

              {/* INSCRIÇÃO */}
              <div className="bg-[#111]/90 p-2 rounded-lg border border-[#333] flex flex-col gap-2">
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

              {/* LISTAS (Lado a lado) */}
              <div className="flex gap-2 h-36">
                <div className="flex-1 border border-[#333] rounded bg-[#161616] flex flex-col overflow-hidden">
                  <div className="header-alunos text-center py-1 text-[8px] text-gray-300 font-black uppercase">Alunos</div>
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
                  <div className="header-professores text-center py-1 text-[8px] text-gray-200 font-black uppercase">Professores</div>
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

              {/* BOTÕES DE AÇÃO PRINCIPAL */}
              <div className="flex flex-col gap-2 mt-1">
                {atletas.length >= 2 && (
                  <button onClick={handleGerar} className="btn-generate-green w-full py-2 text-[10px] shadow-md">
                    GERAR ESCALA DE ROUNDS
                  </button>
                )}
                <button onClick={handleReset} className="btn-danger-fosco w-full py-1.5 text-[9px]">
                  LIMPAR TATAME
                </button>
              </div>

              {/* TABELA DE RESULTADOS */}
              {rounds.length > 0 && (
                <div className="mt-2 border-t border-[#333] pt-3 animate-in fade-in">
                  <h3 className="text-center font-black text-gray-400 mb-2 text-[9px] uppercase tracking-widest">Ordem de Combate</h3>
                  
                  <div className="overflow-x-auto pb-2 hide-scroll">
                    <table className="vk-table w-full shadow-lg">
                      <thead>
                        <tr>
                          <th>R</th>
                          {colunasCombate.map(num => <th key={num}>LUTA {num}</th>)}
                          <th className="text-gray-500">PAUSA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rounds.map(r => (
                          <tr key={r.numero}>
                            <td className="font-black bg-[#222] text-white text-[10px]">{r.numero}</td>
                            {colunasCombate.map(num => {
                              const luta = r.confrontos[num - 1];
                              return (
                                <td key={num} className="whitespace-nowrap">
                                  {luta ? (
                                    <span className="text-[9px] font-bold text-gray-300">
                                      {luta.atleta1.nome} <span className="text-gray-600 italic mx-0.5">v</span> {luta.atleta2.nome}
                                    </span>
                                  ) : <span className="text-gray-700">-</span>}
                                </td>
                              );
                            })}
                            <td className="text-[8px] font-bold text-gray-500 bg-[#111] whitespace-nowrap">
                              {r.descansando ? r.descansando.nome : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-2 mt-3 pb-8">
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
    </ConfigProvider>
  );
}