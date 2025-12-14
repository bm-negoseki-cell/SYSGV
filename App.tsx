import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { IncidentForm } from './components/IncidentForm';
import { ActivityLog } from './components/ActivityLog';
import { CheckInRecord, IncidentReport, ViewState, Coordinates } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // State for data persistence
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => {
    const saved = localStorage.getItem('gv_checkins');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [reports, setReports] = useState<IncidentReport[]>(() => {
    const saved = localStorage.getItem('gv_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentCheckInId, setCurrentCheckInId] = useState<string | null>(() => {
    return localStorage.getItem('gv_current_checkin_id');
  });

  // Effects to save data
  useEffect(() => {
    localStorage.setItem('gv_checkins', JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    localStorage.setItem('gv_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (currentCheckInId) {
      localStorage.setItem('gv_current_checkin_id', currentCheckInId);
    } else {
      localStorage.removeItem('gv_current_checkin_id');
    }
  }, [currentCheckInId]);

  const activeCheckIn = checkIns.find(c => c.id === currentCheckInId) || null;

  const handleCheckIn = (location: Coordinates, postName: string) => {
    const newCheckIn: CheckInRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      location,
      postName
    };
    setCheckIns(prev => [newCheckIn, ...prev]);
    setCurrentCheckInId(newCheckIn.id);
  };

  const handleCheckOut = () => {
    // AUTOMATIC EXPORT: Generate CSV for the current shift's incidents
    // Wrapped in try-catch so checkout proceeds even if download fails/blocks
    try {
      if (activeCheckIn) {
        const sessionReports = reports.filter(r => r.checkInId === activeCheckIn.id);
        
        if (sessionReports.length > 0) {
          const headers = ['ID', 'Data/Hora', 'Posto', 'Tipo', 'Qtd', 'Grau', 'Vitima_Nome', 'Vitima_Idade', 'Vitima_Sexo', 'Obs'];
          const rows = sessionReports.map(r => [
            r.id,
            new Date(r.timestamp).toLocaleString('pt-BR'),
            activeCheckIn.postName,
            r.type,
            r.count,
            r.drowningGrade || '',
            r.victim?.name || '',
            r.victim?.age || '',
            r.victim?.gender || '',
            r.notes ? r.notes.replace(/"/g, '""').replace(/\n/g, ' ') : '' // Escape quotes and newlines
          ].map(field => `"${field}"`)); // Quote all fields

          const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join("\n");
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          
          const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
          const safePostName = activeCheckIn.postName.replace(/[^a-z0-9]/gi, '_');
          // Filename separates by Post as requested
          link.setAttribute("download", `Ocorrencias_${safePostName}_${dateStr}.csv`);
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error("Falha na exportação automática (prosseguindo com logout):", error);
    }

    // Update the current check-in with the checkout timestamp
    setCheckIns(prev => prev.map(c => 
      c.id === currentCheckInId 
        ? { ...c, checkOutTimestamp: new Date().toISOString() }
        : c
    ));
    setCurrentCheckInId(null);
  };

  const handleSubmitReport = (report: IncidentReport) => {
    setReports(prev => [report, ...prev]);
    setCurrentView(ViewState.HISTORY);
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {currentView === ViewState.DASHBOARD && (
        <Dashboard 
          currentCheckIn={activeCheckIn} 
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
      )}
      
      {currentView === ViewState.FORM && (
        <IncidentForm 
          checkInId={currentCheckInId}
          onSubmit={handleSubmitReport}
        />
      )}
      
      {currentView === ViewState.HISTORY && (
        <ActivityLog 
          reports={reports}
          checkIns={checkIns}
        />
      )}
    </Layout>
  );
}

export default App;