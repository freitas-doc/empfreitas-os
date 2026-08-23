import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { OSFormProvider } from './context/OSFormContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <OSFormProvider>
        <RouterProvider router={router} />
      </OSFormProvider>
    </AuthProvider>
  );
}

export default App;
