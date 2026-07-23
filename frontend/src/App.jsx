import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { OSFormProvider } from './context/OSFormContext.jsx';

function App() {
  return (
    <OSFormProvider>
      <RouterProvider router={router} />
    </OSFormProvider>
  );
}

export default App;
