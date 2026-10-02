import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppLayout } from './components/layout/AppLayout';
import { Overview } from './pages/Overview';
import { ClaimsAssurance } from './pages/ClaimsAssurance';
import { Findings } from './pages/Findings';
import { ReviewQueue } from './pages/ReviewQueue';
import { Entities } from './pages/Entities';
import { Reports } from './pages/Reports';
import { Integrations } from './pages/Integrations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="claims" element={<ClaimsAssurance />} />
            <Route path="findings" element={<Findings />} />
            <Route path="review" element={<ReviewQueue />} />
            <Route path="entities" element={<Entities />} />
            <Route path="reports" element={<Reports />} />
            <Route path="integrations" element={<Integrations />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
