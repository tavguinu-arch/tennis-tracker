'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [rolos, setRolos] = useState([]);
  const [raquetas, setRaquetas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data: dadosRolos } = await supabase.from('rolos').select('*');
        if (dadosRolos) setRolos(dadosRolos);

        const { data: dadosRaquetas } = await supabase.from('raquetas').select('*');
        if (dadosRaquetas) setRaquetas(dadosRaquetas);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <p className="text-lg animate-pulse">A carregar o Tennis Tracker...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto font-sans pb-20">
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-emerald-400">Tennis Tracker</h1>
          <p className="text-xs text-slate-400">Gestão Profissional de Encordoamentos</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">
          Admin
        </div>
      </header>

      <section className="mb-6">
        <button 
          onClick={() => alert('Em breve: Formulário rápido para o iPhone!')}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-base active:scale-95"
        >
          <span>➕ Registar Encordoamento</span>
        </button>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Estado dos Rolos</h2>
        <div className="space-y-3">
          {rolos.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl text-center text-slate-400 text-sm">
              Nenhum rolo encontrado.
            </div>
          ) : (
            rolos.map((rolo) => (
              <div key={rolo.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-base text-white">{rolo.nome || 'Rolo de Corda'}</h3>
                    <p className="text-xs text-slate-400">{rolo.marca || 'Standard'}</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {rolo.unidades_restantes} / 18 un.
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (rolo.unidades_restantes / 18) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Raquetas Registadas</h2>
        <div className="space-y-2">
          {raquetas.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl text-center text-slate-400 text-sm">
              Nenhuma raqueta registada.
            </div>
          ) : (
            raquetas.map((raqueta) => (
              <div key={raqueta.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-white">{raqueta.modelo}</p>
                  <p className="text-xs text-slate-400">Cliente: {raqueta.cliente || 'Geral'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                    {raqueta.padrao_mains || 16}M / {raqueta.padrao_crosses || 19}C
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
