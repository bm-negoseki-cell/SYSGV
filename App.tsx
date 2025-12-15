import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { IncidentForm } from './components/IncidentForm';
import { ActivityLog } from './components/ActivityLog';
import { CheckInRecord, IncidentReport, ViewState, Coordinates } from './types';
import { uploadToCentral } from './services/googleDriveService';

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

  const handleCheckOut = async () => {
    // AUTOMATIC EXPORT: Generate CSV for the current shift
    try {
      if (activeCheckIn) {
        const sessionReports = reports.filter(r => r.checkInId === activeCheckIn.id);
        const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        
        // 1. Prepare CSV Content (For Local Download / Backup File)
        const headers = ['Data/Hora', 'Posto', 'Tipo', 'Qtd', 'Grau', 'Vitima_Nome', 'Vitima_Idade', 'Vitima_Sexo', 'Obs'];
        const rows = sessionReports.map(r => [
          new Date(r.timestamp).toLocaleString('pt-BR'),
          activeCheckIn.postName,
          r.type,
          r.count,
          r.drowningGrade || '',
          r.victim?.name || '',
          r.victim?.age || '',
          r.victim?.gender || '',
          r.notes ? r.notes.replace(/"/g, '""').replace(/\n/g, ' ') : '' 
        ].map(field => `"${field}"`)); 

        const csvBody = [headers.join(';'), ...rows.map(r => r.join(';'))].join("\n");
        const safePostName = activeCheckIn.postName.replace(/[^a-z0-9]/gi, '_');
        const fileName = `Turno_${safePostName}_${dateStr}.csv`;

        // Upload to Central (Fast mode, only CSV backup)
        await uploadToCentral(fileName, csvBody);
        
        alert("Turno finalizado. Dados salvos e sincronizados.");
      }
    } catch (error) {
      console.error("Falha na exportação automática:", error);
      alert("Erro ao gerar relatório automático.");
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
  };

  return (
    <Layout 
      currentView={currentView} 
      setView={setCurrentView}
    >
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
          currentCheckInId={currentCheckInId}
        />
      )}
    </Layout>
  );
}

export default App;