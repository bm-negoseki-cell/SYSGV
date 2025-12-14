import React, { useState } from 'react';
import { IncidentReport, VictimData } from '../types';

interface IncidentFormProps {
  checkInId: string | null;
  onSubmit: (report: IncidentReport) => void;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({ checkInId, onSubmit }) => {
  const [activeTab, setActiveTab] = useState<'ROUTINE' | 'CRITICAL'>('ROUTINE');
  
  // Routine States
  const [routineType, setRoutineType] = useState<'ORIENTACAO' | 'ADVERTENCIA' | 'AGUA_VIVA'>('ORIENTACAO');
  const [count, setCount] = useState<number>(1);

  // Critical States
  const [criticalType, setCriticalType] = useState<'RESGATE' | 'AFOGAMENTO'>('RESGATE');
  const [drowningGrade, setDrowningGrade] = useState<number>(1);
  const [victimName, setVictimName] = useState('');
  const [victimAge, setVictimAge] = useState('');
  const [victimGender, setVictimGender] = useState<'M' | 'F' | 'Outro'>('M');
  const [notes, setNotes] = useState('');

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  if (!checkInId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Check-in Necessário</h2>
        <p className="text-gray-600 mt-2">Você precisa iniciar o turno no painel principal para registrar ocorrências.</p>
      </div>
    );
  }

  const validateCriticalFields = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate Name
    if (!victimName.trim()) {
      newErrors.victimName = "O nome da vítima é obrigatório.";
      isValid = false;
    } else if (victimName.trim().length < 3) {
      newErrors.victimName = "O nome deve ter pelo menos 3 caracteres.";
      isValid = false;
    }

    // Validate Age
    if (!victimAge) {
      newErrors.victimAge = "A idade é obrigatória.";
      isValid = false;
    } else {
      const ageNum = parseInt(victimAge);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
        newErrors.victimAge = "Idade inválida.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Regex: Allow empty string (for deletion) or digits only, max 3 characters
    if (val === '' || /^\d{0,3}$/.test(val)) {
      setVictimAge(val);
      // Clear error as user types
      if (errors.victimAge) {
        setErrors(prev => ({ ...prev, victimAge: '' }));
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVictimName(e.target.value);
    if (errors.victimName) {
      setErrors(prev => ({ ...prev, victimName: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'CRITICAL') {
      if (!validateCriticalFields()) {
        return; // Stop submission if validation fails
      }
    }

    const report: IncidentReport = {
      id: crypto.randomUUID(),
      checkInId,
      timestamp: new Date().toISOString(),
      type: activeTab === 'ROUTINE' ? routineType : criticalType,
      count: activeTab === 'ROUTINE' ? count : 1,
      notes: notes || undefined
    };

    if (activeTab === 'CRITICAL') {
      if (criticalType === 'AFOGAMENTO') {
        report.drowningGrade = drowningGrade as any;
      }
      report.victim = {
        name: victimName.trim(),
        age: parseInt(victimAge) || 0,
        gender: victimGender,
        condition: criticalType === 'AFOGAMENTO' ? `Grau ${drowningGrade}` : 'Resgatado'
      };
    }

    onSubmit(report);
    
    // Reset Form
    setCount(1);
    setNotes('');
    setVictimName('');
    setVictimAge('');
    setErrors({});
    
    // Show Success Message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'ROUTINE' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-900' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('ROUTINE')}
        >
          ROTINA
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'CRITICAL' ? 'bg-red-50 text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('CRITICAL')}
        >
          INCIDENTE GRAVE
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        
        {activeTab === 'ROUTINE' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Registro</label>
              <div className="grid grid-cols-1 gap-2">
                <button type="button" onClick={() => setRoutineType('ORIENTACAO')} className={`p-3 rounded-lg border text-left flex justify-between items-center ${routineType === 'ORIENTACAO' ? 'border-blue-900 bg-blue-50 ring-1 ring-blue-900' : 'border-gray-300'}`}>
                  <span className="font-semibold text-gray-800">Orientação a Banhista</span>
                  {routineType === 'ORIENTACAO' && <span className="text-blue-900 font-bold">✓</span>}
                </button>
                <button type="button" onClick={() => setRoutineType('ADVERTENCIA')} className={`p-3 rounded-lg border text-left flex justify-between items-center ${routineType === 'ADVERTENCIA' ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400' : 'border-gray-300'}`}>
                  <span className="font-semibold text-gray-800">Advertência</span>
                  {routineType === 'ADVERTENCIA' && <span className="text-yellow-700 font-bold">✓</span>}
                </button>
                <button type="button" onClick={() => setRoutineType('AGUA_VIVA')} className={`p-3 rounded-lg border text-left flex justify-between items-center ${routineType === 'AGUA_VIVA' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-300'}`}>
                  <span className="font-semibold text-gray-800">Incidente Água-Viva</span>
                  {routineType === 'AGUA_VIVA' && <span className="text-purple-600 font-bold">✓</span>}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setCount(Math.max(1, count - 1))} className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 font-bold text-xl flex items-center justify-center active:bg-gray-300">-</button>
                <input 
                  type="number" 
                  value={count} 
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 text-center border-gray-300 rounded-lg shadow-sm text-2xl font-bold py-2" 
                />
                <button type="button" onClick={() => setCount(count + 1)} className="w-12 h-12 rounded-full bg-blue-900 text-white font-bold text-xl flex items-center justify-center active:bg-blue-800">+</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CRITICAL' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Natureza</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCriticalType('RESGATE')} className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm ${criticalType === 'RESGATE' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  RESGATE
                </button>
                <button type="button" onClick={() => setCriticalType('AFOGAMENTO')} className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm ${criticalType === 'AFOGAMENTO' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  AFOGAMENTO
                </button>
              </div>
            </div>

            {criticalType === 'AFOGAMENTO' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grau de Afogamento (1-6)</label>
                <div className="flex justify-between gap-1">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setDrowningGrade(g)}
                      className={`w-full py-2 rounded font-bold transition-colors ${drowningGrade === g ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">1 (Tosse) -&gt; 6 (PCR)</p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase border-b pb-2">Dados da Vítima</h4>
              <div className="space-y-3">
                <div>
                  <input 
                    type="text" 
                    placeholder="Nome Completo" 
                    value={victimName}
                    onChange={handleNameChange}
                    className={`w-full rounded-md shadow-sm p-2 text-sm border ${errors.victimName ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-900'}`}
                  />
                  {errors.victimName && <p className="text-red-500 text-xs mt-1">{errors.victimName}</p>}
                </div>
                
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <input 
                      type="tel" 
                      inputMode="numeric"
                      placeholder="Idade" 
                      value={victimAge}
                      onChange={handleAgeChange}
                      className={`w-full rounded-md shadow-sm p-2 text-sm border ${errors.victimAge ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-900'}`}
                    />
                    {errors.victimAge && <p className="text-red-500 text-xs mt-1">{errors.victimAge}</p>}
                  </div>
                  <select 
                    value={victimGender}
                    onChange={(e:any) => setVictimGender(e.target.value)}
                    className="w-2/3 rounded-md border-gray-300 shadow-sm p-2 text-sm"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea 
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm p-2 text-sm"
                placeholder="Detalhes adicionais..."
              ></textarea>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="mb-4 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-lg">Registro incluído com sucesso!</span>
          </div>
        )}

        <button 
          type="submit"
          className={`mt-4 w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${activeTab === 'CRITICAL' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          REGISTRAR {activeTab === 'ROUTINE' ? 'OCORRÊNCIA' : 'INCIDENTE'}
        </button>
      </form>
    </div>
  );
};