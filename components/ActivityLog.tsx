import React, { useState } from 'react';
import { IncidentReport, CheckInRecord } from '../types';
import { uploadToCentral } from '../services/googleDriveService';

interface ActivityLogProps {
  reports: IncidentReport[];
  checkIns: CheckInRecord[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ reports, checkIns }) => {
  const [activeTab, setActiveTab] = useState<'INCIDENTS' | 'CHECKINS'>('CHECKINS');
  const [uploading, setUploading] = useState(false);

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
      ...reports.map(r => {
        const checkIn = checkIns.find(c => c.id === r.checkInId);
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
    handleExport(`ocorrencias_gv_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const downloadCheckInsCSV = (date: string, records: CheckInRecord[]) => {
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
    handleExport(`Checkins_${date}.csv`, rows);
  };

  // Group check-ins by date (DD/MM/YYYY)
  const checkInsByDate = checkIns.reduce((acc, curr) => {
    const date = new Date(curr.timestamp).toLocaleDateString('pt-BR').replace(/\//g, '-');
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, CheckInRecord[]>);

  const sortedDates = Object.keys(checkInsByDate).sort((a, b) => {
    // Convert DD-MM-YYYY back to ISO for sorting
    const [da, ma, ya] = a.split('-');
    const [db, mb, yb] = b.split('-');
    return new Date(`${yb}-${mb}-${db}`).getTime() - new Date(`${ya}-${ma}-${da}`).getTime();
  }).reverse(); // Newest first

  const sortedReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'CHECKINS' ? 'bg-white text-blue-900 border-b-2 border-blue-900' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('CHECKINS')}
        >
          LIVRO DE PONTO
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'INCIDENTS' ? 'bg-white text-blue-900 border-b-2 border-blue-900' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('INCIDENTS')}
        >
          OCORRÊNCIAS
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
              disabled={uploading}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              Exportar CSV
            </button>
          </div>
          <div className="space-y-3">
            {sortedReports.length === 0 ? <p className="text-center text-gray-500 py-4">Nenhuma ocorrência registrada.</p> : sortedReports.map(report => (
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
           {sortedDates.length === 0 ? (
             <p className="text-center text-gray-500 py-8">Nenhum registro de ponto encontrado.</p>
           ) : (
             sortedDates.map(date => (
               <div key={date} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                 <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                   <h3 className="font-bold text-gray-800">{date.replace(/-/g, '/')}</h3>
                   <button 
                      onClick={() => downloadCheckInsCSV(date, checkInsByDate[date])}
                      disabled={uploading}
                      className="text-xs flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-semibold border border-green-200 disabled:opacity-50"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                     </svg>
                     Baixar CSV
                   </button>
                 </div>
                 <div className="divide-y divide-gray-100">
                   {checkInsByDate[date].map(record => {
                     const start = new Date(record.timestamp);
                     const end = record.checkOutTimestamp ? new Date(record.checkOutTimestamp) : null;
                     return (
                       <div key={record.id} className="p-3 hover:bg-gray-50 transition-colors">
                         <div className="flex justify-between items-start mb-1">
                           <span className="font-bold text-blue-900 text-sm">{record.postName}</span>
                           <span className={`text-xs px-2 py-0.5 rounded-full ${end ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700 animate-pulse'}`}>
                             {end ? 'Finalizado' : 'Em Andamento'}
                           </span>
                         </div>
                         <div className="flex justify-between text-xs text-gray-600">
                           <span>Entrada: {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           <span>Saída: {end ? end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             ))
           )}
        </div>
      )}
    </div>
  );
};