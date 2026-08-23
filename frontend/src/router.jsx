import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home.jsx';
import NovaOSEmpilhadeira from './pages/NovaOSEmpilhadeira.jsx';
import NovaOSControlador from './pages/NovaOSControlador.jsx';
import HistoricoOS from './pages/HistoricoOS.jsx';
import DetalhesOS from './pages/DetalhesOS.jsx';
import RevisaoAssinaturas from './pages/RevisaoAssinaturas.jsx';
import Clientes from './pages/Clientes.jsx';
import Rascunhos from './pages/Rascunhos.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsuarios from './pages/AdminUsuarios.jsx';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    // Rotas protegidas para Administradores
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin',
        element: <AdminDashboard />
      },
      {
        path: '/admin/usuarios',
        element: <AdminUsuarios />
      }
    ]
  },
  {
    // Rotas protegidas para Técnicos
    element: <ProtectedRoute allowedRoles={['tecnico']} />,
    children: [
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
    ]
  }
]);
