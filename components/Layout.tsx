import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-military-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-military-900 font-bold text-xl border-2 border-white">
              GV
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Operacional</h1>
              <p className="text-xs text-military-100">Corpo de Bombeiros - PR</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 mb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-4xl mx-auto">
          <button
            onClick={() => setView(ViewState.DASHBOARD)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              currentView === ViewState.DASHBOARD ? 'text-military-900' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Posto</span>
          </button>
          
          <button
            onClick={() => setView(ViewState.FORM)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              currentView === ViewState.FORM ? 'text-military-900' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium">Ocorrência</span>
          </button>

          <button
            onClick={() => setView(ViewState.HISTORY)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              currentView === ViewState.HISTORY ? 'text-military-900' : 'text-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">Histórico</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
