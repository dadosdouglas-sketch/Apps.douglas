import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon, RefreshIcon } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    // Tenta limpar o estado local que pode estar causando o erro
    try {
        localStorage.removeItem('cartItems');
        localStorage.removeItem('clientData');
        localStorage.removeItem('cartRate');
    } catch (e) {
        console.error("Erro ao limpar storage", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
            <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-500 text-sm mb-6">
              Ocorreu um erro inesperado na aplicação. Isso pode ter acontecido devido a uma falha de conexão ou dados corrompidos.
            </p>
            
            {this.state.error && (
                <div className="bg-slate-100 p-3 rounded text-left mb-6 overflow-auto max-h-32">
                    <code className="text-[10px] text-slate-600 font-mono block">
                        {this.state.error.toString()}
                    </code>
                </div>
            )}

            <div className="flex gap-3 justify-center">
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                >
                    Recarregar Página
                </button>
                <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                >
                    Resetar Dados
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;