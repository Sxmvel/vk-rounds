import { useState } from 'react';
import { Button, Input, Select, message } from 'antd';
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
    setRounds([]); // Limpa a tabela se adicionar alguém novo
  };

  const handleGerar = () => {
    if (atletas.length < 2) return message.warning("Adicione pelo menos 2 atletas.");
    const novosRounds = gerarEscalaDeRounds(atletas, config);
    setRounds(novosRounds);
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

  // Calcula o número máximo de combates simultâneos para montar as colunas da tabela
  const maxCombates = rounds.length > 0 ? Math.max(...rounds.map(r => r.confrontos.length)) : 0;
  const colunasCombate = Array.from({ length: maxCombates }, (_, i) => i + 1);

  return (
    <div className="p-4 md:p-10 flex justify-center min-h-screen">
      <div className="vk-main-panel w-full max-w-5xl overflow-hidden bg-white/95">

        {/* TÍTULO (Oculto na impressão para economizar tinta) */}
        <div className="text-center py-6 border-b border-gray-300 no-print">
          <h1 className="text-3xl font-black text-gray-800 drop-shadow-sm tracking-tighter uppercase italic">
            VK TEAM <span className="text-red-600">ROUNDS</span>
          </h1>
        </div>

        {/* ÁREA DE CONTROLE E CADASTRO (Não aparece no PDF) */}
        <div className="no-print">
          <div className="bg-gray-100 p-4 flex flex-wrap justify-around gap-4 border-b border-gray-300 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 text-sm">Nº Total de Rounds:</span>
              <Select value={config.totalRounds} onChange={v => setConfig({ ...config, totalRounds: v })} className="w-20 font-bold">
                {[4, 5, 6, 8, 10, 12].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 text-sm">Rounds Separados (A x A & P x P):</span>
              <Select value={config.roundsSeparados} onChange={v => setConfig({ ...config, roundsSeparados: v })} className="w-20 font-bold">
                {[0, 1, 2, 4, 6].map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)}
              </Select>
            </div>
          </div>

          <div className="p-6 bg-white flex gap-3 justify-center border-b border-gray-200">
            <Input
              placeholder="NOME DO ATLETA"
              className="max-w-xs font-bold uppercase"
              size="large"
              value={nome}
              onChange={e => setNome(e.target.value)}
              onPressEnter={handleAdd}
            />
            <Select value={tipo} onChange={setTipo} size="large" className="w-36 font-bold">
              <Select.Option value="ALUNO">Aluno</Select.Option>
              <Select.Option value="PROFESSOR">Professor</Select.Option>
            </Select>
            <Button type="primary" size="large" onClick={handleAdd} className="font-bold bg-blue-600">INSCREVER</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="header-alunos text-center py-2 text-white font-bold uppercase tracking-widest text-sm">Alunos</div>
              <div className="p-2 min-h-[120px] max-h-[250px] overflow-y-auto">
                {atletas.filter(a => a.tipo === 'ALUNO').map(a => (
                  <div key={a.id} className="flex justify-between items-center border-b border-gray-100 py-1.5 px-3 hover:bg-gray-50">
                    <span className="text-gray-700 font-bold text-xs uppercase">● {a.nome}</span>
                    <button onClick={() => setAtletas(atletas.filter(x => x.id !== a.id))} className="text-red-500 font-bold hover:text-red-700">X</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="header-professores text-center py-2 text-white font-bold uppercase tracking-widest text-sm">Professores</div>
              <div className="p-2 min-h-[120px] max-h-[250px] overflow-y-auto">
                {atletas.filter(a => a.tipo === 'PROFESSOR').map(a => (
                  <div key={a.id} className="flex justify-between items-center border-b border-gray-100 py-1.5 px-3 hover:bg-gray-50">
                    <span className="text-gray-700 font-bold text-xs uppercase">● {a.nome}</span>
                    <button onClick={() => setAtletas(atletas.filter(x => x.id !== a.id))} className="text-red-500 font-bold hover:text-red-700">X</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center pb-8 gap-4 px-6">
            {atletas.length >= 2 && (
              <button onClick={handleGerar} className="btn-generate px-10 py-3 rounded-lg font-bold text-lg w-full max-w-md uppercase tracking-wider">
                Gerar Tabela de Rounds
              </button>
            )}
            <Button danger onClick={handleReset} className="h-[52px] px-6 font-bold uppercase">
              Limpar Tatame
            </Button>
          </div>
        </div>

        {/* TABELA DE RESULTADOS (Esta é a área que vai para o PDF) */}
        {rounds.length > 0 && (
          <div className="p-8 bg-white border-t border-gray-300 animate-in fade-in duration-500">
            <h3 className="text-center font-black text-gray-800 mb-6 tracking-widest uppercase text-xl border-b pb-4">
              Ordem de Combate Oficial
            </h3>

            <div className="overflow-x-auto pb-4">
              <table className="vk-table shadow-sm min-w-full">
                <thead>
                  <tr>
                    <th className="w-16">ROUND</th>
                    {colunasCombate.map(num => (
                      <th key={num}>COMBATE {num}</th>
                    ))}
                    <th className="bg-blue-50 text-blue-800">DESCANSO</th>
                  </tr>
                </thead>
                <tbody>
                  {rounds.map(r => (
                    <tr key={r.numero}>
                      <td className="font-black text-lg bg-gray-50">{r.numero}</td>

                      {/* Renderiza as lutas baseadas no número máximo de colunas */}
                      {colunasCombate.map(num => {
                        const luta = r.confrontos[num - 1]; // Pega a luta correspondente à coluna
                        return (
                          <td key={num}>
                            {luta ? (
                              <div className="flex justify-between items-center px-2">
                                <span className="font-bold text-gray-700 uppercase text-right truncate">{luta.atleta1.nome}</span>
                                <span className="text-red-600 font-black italic mx-2"> VS </span>
                                <span className="font-bold text-gray-700 uppercase text-left truncate">{luta.atleta2.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="text-xs font-bold bg-blue-50/30">
                        {r.descansando ? (
                          <span className="text-blue-600 uppercase">{r.descansando.nome}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BOTÕES INFERIORES */}
            <div className="flex justify-center mt-8 gap-4 no-print">
              <Button type="primary" size="large" onClick={handleGerar} className="bg-blue-600 font-bold w-48 shadow-md">
                NOVA SEQUÊNCIA
              </Button>
              <Button size="large" onClick={handleExport} className="bg-gray-200 text-gray-700 font-bold border-gray-400 w-48 shadow-md hover:bg-gray-300">
                EXPORTAR TABELA
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}