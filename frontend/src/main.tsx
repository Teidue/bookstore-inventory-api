import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { Toasts } from './components/ui/Toasts';
import { ToastsProvider } from './contexts/ToastsProvider';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('No se ha encontrado el elemento #root en index.html.');
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      {/* Las notificaciones envuelven a la aplicación entera: cualquier
          pantalla puede avisar del resultado de una operación. */}
      <ToastsProvider>
        <App />
        <Toasts />
      </ToastsProvider>
    </BrowserRouter>
  </StrictMode>,
);
