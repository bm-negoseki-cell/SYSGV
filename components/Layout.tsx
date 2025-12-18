import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setView
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-red-500 shadow-sm overflow-hidden p-1 relative">
               <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                 <circle cx="50" cy="50" r="45" fill="#dc2626" />
                 <circle cx="50" cy="50" r="22" fill="white" />
                 <path d="M46 5 H54 V28 H46 Z" fill="white" />
                 <path d="M46 72 H54 V95 H46 Z" fill="white" />
                 <path d="M5 46 H28 V54 H5 Z" fill="white" />
                 <path d="M72 46 H95 V54 H72 Z" fill="white" />
               </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">SYSGV</h1>
              <p className="text-[10px] text-blue-200 uppercase">Litoral do Paraná</p>
            </div>
          </div>
          
          <button 
            onClick={() => setView(ViewState.SUPERVISOR)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              currentView === ViewState.SUPERVISOR 
              ? 'bg-yellow-400 border-yellow-400 text-blue-900' 
              : 'border-blue-400 text-blue-200 hover:bg-blue-800'
            }`}
          >
            SUPERVISÃO
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 mb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-4xl mx-auto">
          <button
            onClick={() => setView(ViewState.DASHBOARD)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === ViewState.DASHBOARD ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-bold uppercase">Posto</span>
          </button>
          
          <button
            onClick={() => setView(ViewState.FORM)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === ViewState.FORM ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase">Lançar</span>
          </button>

          <button
            onClick={() => setView(ViewState.HISTORY)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === ViewState.HISTORY ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] font-bold uppercase">Histórico</span>
          </button>
        </div>
      </nav>
    </div>
  );
};