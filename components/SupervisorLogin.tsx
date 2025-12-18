import React, { useState } from 'react';

interface SupervisorLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const SupervisorLogin: React.FC<SupervisorLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'cbpontal' && password === 'cbpontal') {
      onLoginSuccess();
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-blue-900 uppercase">Acesso Restrito</h2>
          <p className="text-sm text-gray-500 font-medium">Área de Supervisão Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
              placeholder="Digite o login"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-200 text-center animate-bounce">
              Credenciais Inválidas!
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-800 active:scale-95 transition-all"
            >
              ENTRAR
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-600 font-bold py-2 rounded-xl hover:bg-gray-200 transition-all text-sm"
            >
              VOLTAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};