import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Star, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AgendarConsulta from './AgendarConsulta';

const ESPECIALIDADES = [
  'Todas', 'Clínico Geral', 'Cardiologia', 'Dermatologia', 'Ginecologia',
  'Ortopedia', 'Pediatria', 'Psiquiatria', 'Neurologia', 'Endocrinologia'
];

export default function BuscarMedicos({ paciente }) {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [especialidade, setEspecialidade] = useState('Todas');
  const [selectedMedico, setSelectedMedico] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const all = await base44.entities.UsuarioTelemed.filter({ ativo: true });
        const medics = all.filter(u => u.role === 'MEDICO_AVULSO' || u.role === 'MEDICO_VINCULADO');
        setMedicos(medics);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = medicos.filter(m => {
    const matchSearch = m.nome?.toLowerCase().includes(search.toLowerCase()) ||
      m.especialidade?.toLowerCase().includes(search.toLowerCase());
    const matchEsp = especialidade === 'Todas' || m.especialidade === especialidade;
    return matchSearch && matchEsp;
  });

  if (selectedMedico) {
    return <AgendarConsulta medico={selectedMedico} paciente={paciente} onBack={() => setSelectedMedico(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 h-11 text-base"
          placeholder="Buscar médico ou especialidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filtros de especialidade */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {ESPECIALIDADES.map(esp => (
          <button
            key={esp}
            onClick={() => setEspecialidade(esp)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              especialidade === esp
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {esp}
          </button>
        ))}
      </div>

      {/* Lista de médicos */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum médico encontrado</p>
          <p className="text-sm mt-1">Tente outra especialidade ou nome</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(medico => (
            <button
              key={medico.id}
              onClick={() => setSelectedMedico(medico)}
              className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">
                  {medico.nome?.charAt(0) || 'M'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{medico.nome}</p>
                <p className="text-sm text-primary font-medium">{medico.especialidade || 'Clínico Geral'}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> Disponível hoje
                  </span>
                  {medico.crm && (
                    <span className="text-xs text-muted-foreground">CRM: {medico.crm}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}