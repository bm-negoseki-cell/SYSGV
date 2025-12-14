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
            {/* Stylized Wave Icon - Custom SVG matching reference */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm overflow-hidden p-1">
               <svg viewBox="0 0 100 100" className="w-full h-full text-blue-700" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                 {/* Main Wave Body */}
                 <path d="M10,85 C15,80 20,75 25,78 C35,85 45,60 55,45 C65,30 80,20 90,35 C95,42 92,55 85,60 C80,63 75,55 80,45 C82,40 85,38 88,38 C82,28 70,30 60,40 C50,50 40,75 30,80 C20,85 10,85 10,85 Z" />
                 {/* The Curl/Lip */}
                 <path d="M90,35 C80,10 50,15 35,40 C25,55 20,70 15,85 C15,85 5,85 2,80 C5,60 20,30 40,15 C60,0 85,5 90,35 Z" />
                 {/* Internal Detail/Foam */}
                 <path d="M45,35 C55,25 70,22 80,32 C75,28 65,28 55,38 C50,42 48,40 45,35 Z" fill="currentColor" opacity="0.8"/>
               </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-tight">SYSGV</h1>
              <p className="text-xs text-blue-200">Sistema Operacional - PR</p>
            </div>
          </div>
          
          {/* Drive Button Removed as requested */}
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
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === ViewState.DASHBOARD ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Posto</span>
          </button>
          
          <button
            onClick={() => setView(ViewState.FORM)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === ViewState.FORM ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium">Ocorrência</span>
          </button>

          <button
            onClick={() => setView(ViewState.HISTORY)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === ViewState.HISTORY ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'
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