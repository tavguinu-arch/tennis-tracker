'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [reels, setReels] = useState([]);
  const [rackets, setRackets] = useState([]);
  const [stringers, setStringers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Campos do formulário de registo de encordoamento
  const [selectedRacket, setSelectedRacket] = useState('');
  const [selectedReel, setSelectedReel] = useState('');
  const [selectedStringer, setSelectedStringer] = useState('');
  const [mainTension, setMainTension] = useState('23');
  const [crossTension, setCrossTension] = useState('23');
  const [serviceCost, setServiceCost] = useState('5.00');
  const [notes, setNotes] = useState('Full bed');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    
    // 1. Carregar Rolos com os dados da corda associada
    const { data: dadosReels } = await supabase
      .from('string_reels')
      .select('*, strings(brand, name, gauge)');
    if (dadosReels) setReels(dadosReels);

    // 2. Carregar Raquetes Físicas com o modelo associado
    const { data: dadosRackets } = await supabase
      .from('rackets')
      .select('*, racket_models(brand, model_name, string_pattern)');
    if (dadosRackets) setRackets(dadosRackets);

    // 3. Carregar Encordoadores
    const { data: dadosStringers } = await supabase
      .from('stringers')
      .select('*');
    if (dadosStringers) setStringers(dadosStringers);

    setLoading(false);
  }

  async function handleRegistarEncordoamento(e) {
    e.preventDefault();
    if (!selectedRacket || !selectedReel) {
      alert('Por favor selecione a raquete e o rolo.');
      return;
    }

    const reelObj = reels.find(r => r.id === parseInt(selectedReel));
    if (!reelObj) return;

    // Cálculo do consumo: Full bed = 1 unidade gasta no rolo
    const consumo = 1; 
    const novasUnidades = Math.max(0, Number(reelObj.total_stringings) - consumo);

    // 1. Atualizar o stock restante/total no rolo
    const { error: errorReel } = await supabase
      .from('string_reels')
      .update({ total_stringings: novasUnidades })
      .eq('id', reelObj.id);

    if (errorReel) {
      alert('Erro ao atualizar o rolo: ' + errorReel.message);
      return;
    }

    // 2. Inserir o registo na tabela oficial de histórico (stringings)
    const { error: errorStringing } = await supabase
      .from('stringings')
      .insert([
        {
          racket_id: parseInt(selectedRacket),
          main_reel_id: parseInt(selectedReel),
          main_tension_kg: parseFloat(mainTension),
          cross_reel_id: parseInt(selectedReel),
          cross_tension_kg: parseFloat(crossTension),
          stringing_date: new Date().toISOString().split('T')[0],
          service_cost: parseFloat(serviceCost),
          stringer_id: selectedStringer ? parseInt(selectedStringer) : null,
          notes: notes
        }
      ]);

    if (errorStringing) {
      alert('Erro ao guardar histórico: ' + errorStringing.message);
    } else {
      alert(`Encordoamento registado com sucesso! Restam ${novasUnidades} utilizações no rolo.`);
      setShowModal(false);
      carregarDados();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-emerald-400">
        <p className="animate-pulse font-medium text-sm">A carregar Tennis Tracker...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 max-w-md mx-auto font-sans pb-20">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-3 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-emerald-400">Tennis Tracker</h1>
          <p className="text-xs text-gray-400">Gestão Profissional de Encordoamentos</p>
        </div>
        <span className="text-xs font-semibold bg-gray-900 border border-gray-800 px-3 py-1 rounded-full text-emerald-400">
          Admin
        </span>
      </header>

      {/* Botão de Ação */}
      <button 
        onClick={() => setShowModal(true)}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2 text-sm mb-6 active:scale-98 cursor-pointer"
      >
        <span>➕ Registar Encordoamento</span>
      </button>

      {/* Modal / Formulário */}
      {showModal && (
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-2xl mb-6">
          <h3 className="text-base font-bold text-emerald-400 mb-4">Novo Encordoamento</h3>
          <form onSubmit={handleRegistarEncordoamento} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Rolo Utilizado:</label>
              <select 
                value={selectedReel} 
                onChange={e => setSelectedReel(e.target.value)} 
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Selecione o rolo</option>
                {reels.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.strings?.brand} {r.strings?.name} ({r.strings?.gauge}) — {r.total_stringings} un. restam
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Raquete:</label>
              <select 
                value={selectedRacket} 
                onChange={e => setSelectedRacket(e.target.value)} 
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Selecione a raquete</option>
                {rackets.map(rq => (
                  <option key={rq.id} value={rq.id}>
                    {rq.identifier} ({rq.racket_models?.brand} {rq.racket_models?.model_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Tensão Mains (kg):</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={mainTension} 
                  onChange={e => setMainTension(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Tensão Crosses (kg):</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={crossTension} 
                  onChange={e => setCrossTension(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Custo Serviço (€):</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={serviceCost} 
                  onChange={e => setServiceCost(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Encordoador:</label>
                <select 
                  value={selectedStringer} 
                  onChange={e => setSelectedStringer(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione</option>
                  {stringers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Notas / Detalhes:</label>
              <input 
                type="text" 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-3 rounded-xl text-sm transition cursor-pointer">Confirmar</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl text-sm transition cursor-pointer">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Estado dos Rolos */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Estado dos Rolos</h2>
        <div className="space-y-3">
          {reels.map(r => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-bold text-sm text-gray-100">{r.strings?.brand} {r.strings?.name} ({r.strings?.gauge})</span>
                  <p className="text-xs text-gray-400">Comprado a {r.purchase_date} ({r.price}€)</p>
                </div>
                <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  {r.total_stringings} un.
                </span>
              </div>
              <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min(100, (r.total_stringings / 18) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raquetas Registadas */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Raquetas Registadas</h2>
        <div className="space-y-2.5">
          {rackets.map(rq => (
            <div key={rq.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex justify-between items-center shadow-sm">
              <div>
                <p className="font-bold text-sm text-gray-100">{rq.identifier} — {rq.racket_models?.model_name}</p>
                <p className="text-xs text-gray-400">Compra: {rq.purchase_date} ({rq.price}€)</p>
              </div>
              <span className="text-xs font-mono font-semibold bg-gray-950 border border-gray-800 px-2.5 py-1.5 rounded-xl text-emerald-400">
                {rq.racket_models?.string_pattern || '16x19'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
