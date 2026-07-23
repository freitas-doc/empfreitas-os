import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home.jsx';
import NovaOSEmpilhadeira from './pages/NovaOSEmpilhadeira.jsx';
import NovaOSControlador from './pages/NovaOSControlador.jsx';
import HistoricoOS from './pages/HistoricoOS.jsx';
import DetalhesOS from './pages/DetalhesOS.jsx';
import RevisaoAssinaturas from './pages/RevisaoAssinaturas.jsx';
import Clientes from './pages/Clientes.jsx';
import Rascunhos from './pages/Rascunhos.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/nova-os/empilhadeira',
    element: <NovaOSEmpilhadeira />
  },
  {
    path: '/nova-os/controlador',
    element: <NovaOSControlador />
  },
  {
    path: '/historico',
    element: <HistoricoOS />
  },
  {
    path: '/historico/:id',
    element: <DetalhesOS />
  },
  {
    path: '/revisao/:id',
    element: <RevisaoAssinaturas />
  },
  {
    path: '/clientes',
    element: <Clientes />
  },
  {
    path: '/rascunhos',
    element: <Rascunhos />
  }
]);
