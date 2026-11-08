'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [rolos, setRolos] = useState([]);
  const [raquetas, setRaquetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Campos do formulário
  const [selectedRolo, setSelectedRolo] = useState('');
  const [selectedRaqueta, setSelectedRaqueta] = useState('');
  const [tipoStringing, setTipoStringing] = useState('full'); // 'full', 'mains', 'crosses'

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: dadosRolos } = await supabase.from('rolos').select('*');
    if (dadosRolos) setRolos(dadosRolos);

    const { data: dadosRaquetas } = await supabase.from('raquetas').select('*');
    if (dadosRaquetas) setRaquetas(dadosRaquetas);
    setLoading(false);
  }

  async function handleRegistarEncordoamento(e) {
    e.preventDefault();
    if (!selectedRolo || !selectedRaqueta) {
      alert('Por favor selecione o rolo e a raqueta.');
      return;
    }

    const roloObj = rolos.find(r => r.id === parseInt(selectedRolo) || r.id === selectedRolo);
    if (!roloObj) return;

    // Cálculo do consumo: Full = 1 un | Mains = 0.5 un | Crosses = 0.5 un
    let consumo = 1;
    if (tipoStringing === 'mains' || tipoStringing === 'crosses') {
      consumo = 0.5;
    }

    const novasUnidades = Math.max(0, Number(roloObj.unidades_restantes) - consumo);

    // 1. Atualizar rolo no Supabase
    const { error: errorRolo } = await supabase
      .from('rolos')
      .update({ unidades_restantes: novasUnidades })
      .eq('id', roloObj.id);

    if (errorRolo) {
      alert('Erro ao atualizar rolo: ' + errorRolo.message);
      return;
    }

    alert(`Encordoamento registado com sucesso! Consumo: ${consumo} un. Restam: ${novasUnidades} un.`);
    setShowModal(false);
    carregarDados();
  }

  if (loading) {
    return (
      <div style={{ padding: 20, fontFamily: 'sans-serif', background: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>A carregar Tennis Tracker...</p>
      </div>
    );
  }

  return (
    <main style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 450, margin: '0 auto', background: '#090d16', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#34d399', margin: 0 }}>Tennis Tracker</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Gestão Profissional de Encordoamentos</p>
        </div>
        <span style={{ fontSize: 11, background: '#1e293b', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>Admin</span>
      </header>

      <button 
        onClick={() => setShowModal(true)}
        style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 'bold', background: '#10b981', color: '#090d16', border: 'none', borderRadius: 10, cursor: 'pointer', marginBottom: 20 }}
      >
        ➕ Registar Encordoamento
      </button>

      {/* Modal / Formulário de Registo */}
      {showModal && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: 16, marginBottom: 20, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, fontSize: 16, color: '#34d399' }}>Novo Encordoamento</h3>
          <form onSubmit={handleRegistarEncordoamento}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#cbd5e1' }}>Rolo Utilizado:</label>
              <select 
                value={selectedRolo} 
                onChange={e => setSelectedRolo(e.target.value)} 
                required
                style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
              >
                <option value="">Selecione um rolo</option>
                {rolos.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nome} ({r.unidades_restantes} un. restam)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#cbd5e1' }}>Raqueta:</label>
              <select 
                value={selectedRaqueta} 
                onChange={e => setSelectedRaqueta(e.target.value)} 
                required
                style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
              >
                <option value="">Selecione a raqueta</option>
                {raquetas.map(rq => (
                  <option key={rq.id} value={rq.id}>
                    {rq.modelo} - {rq.cliente}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#cbd5e1' }}>Tipo de Encordoamento:</label>
              <select 
                value={tipoStringing} 
                onChange={e => setTipoStringing(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
              >
                <option value="full">Completo / Full Bed (1.0 un)</option>
                <option value="mains">Apenas Mains / Verticais (0.5 un)</option>
                <option value="crosses">Apenas Crosses / Horizontais (0.5 un)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#10b981', color: '#090d16', fontWeight: 'bold', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Confirmar</button>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#334155', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>Estado dos Rolos</h3>
      {rolos.length === 0 ? <p style={{ fontSize: 14, color: '#64748b' }}>Nenhum rolo encontrado.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {rolos.map(r => (
            <div key={r.id} style={{ background: '#1e293b', border: '1px solid #334155', padding: 14, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong>{r.nome}</strong>
                <span style={{ color: '#34d399', fontWeight: 'bold' }}>{r.unidades_restantes} / 18 un.</span>
              </div>
              <div style={{ background: '#0f172a', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (r.unidades_restantes / 18) * 100)}%`, background: '#10b981', height: '100%', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>Raquetas Registadas</h3>
      {raquetas.length === 0 ? <p style={{ fontSize: 14, color: '#64748b' }}>Nenhuma raqueta registada.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {raquetas.map(rq => (
            <div key={rq.id} style={{ background: '#1e293b', border: '1px solid #334155', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: 14 }}>{rq.modelo}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{rq.cliente}</p>
              </div>
              <span style={{ fontSize: 11, background: '#0f172a', padding: '4px 8px', borderRadius: 6, color: '#cbd5e1' }}>
                {rq.padrao_mains || 16}M / {rq.padrao_crosses || 19}C
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
