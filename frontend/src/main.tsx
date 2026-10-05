import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { Notificaciones } from './components/ui/Notificaciones';
import { NotificacionesProveedor } from './contexts/NotificacionesProveedor';
import './styles/global.css';

const contenedor = document.getElementById('root');

if (!contenedor) {
  throw new Error('No se ha encontrado el elemento #root en index.html.');
}

createRoot(contenedor).render(
  <StrictMode>
    <BrowserRouter>
      {/* Las notificaciones envuelven a la aplicación entera: cualquier
          pantalla puede avisar del resultado de una operación. */}
      <NotificacionesProveedor>
        <App />
        <Notificaciones />
      </NotificacionesProveedor>
    </BrowserRouter>
  </StrictMode>,
);
