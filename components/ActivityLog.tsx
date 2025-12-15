import React, { useState } from 'react';
import { IncidentReport, CheckInRecord } from '../types';
import { uploadToCentral } from '../services/googleDriveService';

interface ActivityLogProps {
  reports: IncidentReport[];
  checkIns: CheckInRecord[];
  currentCheckInId: string | null;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ reports, checkIns, currentCheckInId }) => {
  const [activeTab, setActiveTab] = useState<'INCIDENTS' | 'CHECKINS'>('CHECKINS');
  const [uploading, setUploading] = useState(false);

  // FILTER: Only show data for the currently active check-in
  const filteredReports = reports.filter(r => r.checkInId === currentCheckInId);
  const filteredCheckIns = checkIns.filter(c => c.id === currentCheckInId);

  const activeCheckIn = filteredCheckIns.length > 0 ? filteredCheckIns[0] : null;

  const handleExport = async (filename: string, rows: string[][]) => {
    // Use semicolon (;) delimiter for Excel cell separation
    const csvBody = rows.map(e => e.join(";")).join("\n");
    setUploading(true);
    await uploadToCentral(filename, csvBody);
    setUploading(false);
  };

  const downloadIncidentsCSV = () => {
    const rows = [
      ['Data/Hora', 'Posto', 'Tipo', 'Qtd', 'Grau', 'Vitima_Nome', 'Vitima_Idade', 'Vitima_Sexo', 'Obs'],
      ...filteredReports.map(r => {
        const checkIn = filteredCheckIns.find(c => c.id === r.checkInId);
        return [
          new Date(r.timestamp).toLocaleString(),
          checkIn?.postName || 'N/A',
          r.type,
          r.count,
          r.drowningGrade || '',
          r.victim?.name || '',
          r.victim?.age || '',
          r.victim?.gender || '',
          r.notes || ''
        ].map(cell => `"${cell}"`);
      })
    ];
    handleExport(`ocorrencias_turno_atual_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const downloadCheckInsCSV = () => {
    if (!activeCheckIn) return;
    const records = [activeCheckIn];
    const date = new Date(activeCheckIn.timestamp).toLocaleDateString('pt-BR').replace(/\//g, '-');
    
    const rows = [
      ['Data', 'Posto', 'Inicio', 'Fim', 'Duracao_Horas', 'Latitude', 'Longitude'],
      ...records.map(c => {
        const start = new Date(c.timestamp);
        const end = c.checkOutTimestamp ? new Date(c.checkOutTimestamp) : null;
        const duration = end ? ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2) : 'Em andamento';
        
        return [
          date,
          c.postName,
          start.toLocaleTimeString(),
          end ? end.toLocaleTimeString() : '---',
          duration,
          c.location.latitude,
          c.location.longitude
        ].map(cell => `"${cell}"`);
      })
    ];
    handleExport(`Checkin_turno_atual_${date}.csv`, rows);
  };

  // If no active check-in, show empty state (Privacy/Relevance focus)
  if (!currentCheckInId || !activeCheckIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-sm mt-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Histórico do Turno</h2>
        <p className="text-gray-600 mt-2">Realize o <strong>Check-in</strong> no Posto para visualizar e registrar as atividades do serviço atual.</p>
        <p className="text-xs text-gray-400 mt-4">Registros anteriores são arquivados automaticamente.</p>
      </div>
    );
  }

  const sortedReports = [...filteredReports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4">
      {/* Header Info for Context */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center mb-2">
         <div>
           <p className="text-xs text-blue-800 uppercase font-bold">Posto Atual</p>
           <p className="text-sm font-bold text-blue-900">{activeCheckIn.postName}</p>
         </div>
         <div className="text-right">
            <p className="text-xs text-blue-800 uppercase font-bold">Início</p>
            <p className="text-sm font-bold text-blue-900">{new Date(activeCheckIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
         </div>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'CHECKINS' ? 'bg-white text-blue-900 border-b-2 border-blue-900' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('CHECKINS')}
        >
          REGISTRO DO POSTO
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'INCIDENTS' ? 'bg-white text-blue-900 border-b-2 border-blue-900' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('INCIDENTS')}
        >
          OCORRÊNCIAS ({filteredReports.length})
        </button>
      </div>

      {uploading && (
         <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm text-center animate-pulse border border-blue-200">
           Gerando arquivo e salvando...
         </div>
      )}

      {activeTab === 'INCIDENTS' && (
        <>
          <div className="flex justify-end mb-2">
            <button 
              onClick={downloadIncidentsCSV}
              disabled={uploading || filteredReports.length === 0}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50 disabled:bg-gray-300"
            >
              Exportar CSV
            </button>
          </div>
          <div className="space-y-3">
            {sortedReports.length === 0 ? <p className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-gray-300">Nenhuma ocorrência registrada neste turno ainda.</p> : sortedReports.map(report => (
              <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border border-gray-100 flex justify-between items-start"
                   style={{ borderLeftColor: report.type === 'AFOGAMENTO' || report.type === 'RESGATE' ? '#dc2626' : '#1e3a8a' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      report.type === 'AFOGAMENTO' ? 'bg-red-100 text-red-600' :
                      report.type === 'RESGATE' ? 'bg-orange-100 text-orange-600' :
                      report.type === 'ADVERTENCIA' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-50 text-blue-900'
                    }`}>
                      {report.type}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {report.victim ? (
                    <div className="mt-2 text-sm text-gray-700">
                      <p><strong>Vítima:</strong> {report.victim.name} ({report.victim.age} anos, {report.victim.gender})</p>
                      {report.drowningGrade && <p className="text-red-600 font-bold">Grau: {report.drowningGrade}</p>}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-gray-700">Quantidade: {report.count}</p>
                  )}
                  {report.notes && <p className="mt-1 text-xs text-gray-500 italic">"{report.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'CHECKINS' && (
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
             <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
               <h3 className="font-bold text-gray-800">Turno Atual</h3>
               <button 
                  onClick={downloadCheckInsCSV}
                  disabled={uploading}
                  className="text-xs flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-semibold border border-green-200 disabled:opacity-50"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                 </svg>
                 Baixar CSV
               </button>
             </div>
             <div className="p-4 space-y-3">
                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                   <span className="text-sm text-gray-500">Posto</span>
                   <span className="font-bold text-blue-900">{activeCheckIn.postName}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                   <span className="text-sm text-gray-500">Status</span>
                   <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold animate-pulse">EM ANDAMENTO</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                   <span className="text-sm text-gray-500">Horário Check-in</span>
                   <span className="font-medium text-gray-800">{new Date(activeCheckIn.timestamp).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2">
                   <span className="text-sm text-gray-500">Localização (GPS)</span>
                   <span className="text-xs font-mono bg-gray-100 p-1 rounded">{activeCheckIn.location.latitude.toFixed(5)}, {activeCheckIn.location.longitude.toFixed(5)}</span>
                 </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};