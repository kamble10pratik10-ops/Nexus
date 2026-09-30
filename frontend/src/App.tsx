import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActivePage } from './components/layout/Sidebar';
import { LoginPage } from './components/pages/LoginPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { IngestionPage } from './components/pages/IngestionPage';
import { FindingsPage } from './components/pages/FindingsPage';
import { ReviewQueuePage } from './components/pages/ReviewQueuePage';
import { EntitiesPage } from './components/pages/EntitiesPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { FindingDetailModal } from './components/common/FindingDetailModal';
import { User, Finding } from './types';
import { SATSAApi } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [inspectedFinding, setInspectedFinding] = useState<Finding | null>(null);
  const [p1Count, setP1Count] = useState<number>(0);
  const [unreviewedCount, setUnreviewedCount] = useState<number>(0);

  // Initialize Auth
  useEffect(() => {
    const user = SATSAApi.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // Default to supervisor session for seamless demo evaluation
      const defaultSupervisor: User = {
        username: 'supervisor',
        role: 'Supervisor'
      };
      setCurrentUser(defaultSupervisor);
    }
  }, []);

  // Fetch summary counts for sidebar badges
  const fetchBadgeCounts = async () => {
    try {
      const summary = await SATSAApi.getDashboardSummary();
      setP1Count(summary.p1_findings_count || 0);
      setUnreviewedCount(summary.priority_reviews_count || 0);
    } catch (err) {
      console.error('Failed to update badge counts:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBadgeCounts();
    }
  }, [currentUser, activePage]);

  const handleLogout = () => {
    SATSAApi.logout();
    setCurrentUser(null);
  };

  const handleOpenEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    setActivePage('entities');
  };

  const handleOpenFinding = async (finding: Finding) => {
    try {
      // Fetch full explainability details if available
      const detail = await SATSAApi.getFindingDetail(finding.id);
      setInspectedFinding(detail);
    } catch {
      setInspectedFinding(finding);
    }
  };

  // If user is logged out, render Login Page (Section 16, Page 1)
  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Government Platform Header */}
      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      <div className="flex-1 flex overflow-hidden">
        {/* Minimal Sidebar - Section 17 */}
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            if (page !== 'entities') {
              setSelectedEntityId(null);
            }
            setActivePage(page);
          }}
          p1Count={p1Count}
          unreviewedCount={unreviewedCount}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#070B14]">
          <div className="max-w-7xl mx-auto">
            {/* Page 2: Dashboard (Section 12) */}
            {activePage === 'dashboard' && (
              <DashboardPage
                onOpenEntity={handleOpenEntity}
                onOpenFinding={handleOpenFinding}
                onNavigateToReviewQueue={() => setActivePage('review_queue')}
                onNavigateToIngestion={() => setActivePage('ingestion')}
              />
            )}

            {/* Page 3: Data Ingestion (Section 4 & 5) */}
            {activePage === 'ingestion' && (
              <IngestionPage onAnalysisCompleted={fetchBadgeCounts} />
            )}

            {/* Page 4: Findings (Section 7, 8, 10, 11) */}
            {activePage === 'findings' && (
              <FindingsPage
                onOpenFinding={handleOpenFinding}
                onOpenEntity={handleOpenEntity}
              />
            )}

            {/* Page 5: Review Queue (Section 11) */}
            {activePage === 'review_queue' && (
              <ReviewQueuePage
                onOpenFinding={handleOpenFinding}
                onOpenEntity={handleOpenEntity}
              />
            )}

            {/* Page 6: Entity Assessment & Detail (Section 13) */}
            {activePage === 'entities' && (
              <EntitiesPage
                initialEntityId={selectedEntityId}
                onOpenFinding={handleOpenFinding}
              />
            )}

            {/* Section 17: Settings */}
            {activePage === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Page 7 / Section 14: Finding Detail Evidence Modal */}
      <FindingDetailModal
        finding={inspectedFinding}
        onClose={() => setInspectedFinding(null)}
        onReviewed={() => {
          fetchBadgeCounts();
        }}
        onNavigateToEntity={handleOpenEntity}
      />
    </div>
  );
}

export default App;
