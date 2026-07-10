import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TransitProvider } from './context/TransitContext';
import ErrorBoundary from './components/ErrorBoundary';
import AuthSection from './components/AuthSection';
import SearchSection from './components/SearchSection';
import RouteCard from './components/RouteCard';
import RouteDetails from './components/RouteDetails';
import FeedSection from './components/FeedSection';
import CrowdsourceSection from './components/CrowdsourceSection';
import MapView from './components/MapView';
import NearbyTransit from './components/NearbyTransit';
import RegionSelector from './components/RegionSelector';
import CommentsPanel from './components/CommentsPanel';
import AiExplainPanel from './components/AiExplainPanel';
import EmergencySection from './components/EmergencySection';
import MobileNav from './components/MobileNav';
import NotificationBell from './components/NotificationBell';
import ChatPanel from './components/ChatPanel';
import { ToastContainer } from './components/Toast';
import { useTransit } from './context/TransitContext';
import useLocationSync from './hooks/useLocationSync';
import { useState, useRef } from 'react';

function AppContent() {
  const { routes, selectedRoute, setSelectedRoute, loading, searchRoutes, region, setRegion } = useTransit();
  const { user } = useAuth();
  useLocationSync();
  const [commentPostId, setCommentPostId] = useState(null);
  const [aiRoute, setAiRoute] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [showAi, setShowAi] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyCoords, setNearbyCoords] = useState(null);
  const setFromRef = useRef(null);

  const handleSearch = ({ from, to }) => {
    setSearchQuery(`${from} → ${to}`);
    searchRoutes(from, to);
  };

  return (
    <div className="max-w-[1100px] mx-auto p-4 pb-20 sm:pb-4 grid gap-3.5">
      {/* Top Bar */}
      <header className="card flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <RegionSelector selected={region} onSelect={setRegion} />
          <div>
            <h1 className="m-0 text-[1.7rem] font-bold tracking-wide" style={{ color: '#2E7D32' }}>
              পথিক{' '}
              <span className="badge-blue align-middle ml-2">ঢাকা</span>
            </h1>
            <p className="mt-1.5 text-[0.93rem]" style={{ color: '#6b7280' }}>
              Verified low-cost public transport routes for Dhaka Metro area
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setShowChat(true)}
            className="btn-secondary text-xs"
          >
            💬 AI Chat
          </button>
          <nav className="hidden sm:flex gap-1">
            {[
              { id: 'home', label: '🏠 Home' },
              { id: 'feed', label: '📰 Feed' },
              { id: 'emergency', label: '🚨 SOS' },
              { id: 'map', label: '🗺️ Map' },
              { id: 'community', label: '🤝 Community' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeSection === s.id ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Auth */}
      <AuthSection />

      {/* ===== HOME SECTION ===== */}
      {activeSection === 'home' && (
        <>
          <SearchSection onSearch={handleSearch} loading={loading} onShowNearby={setNearbyCoords} onSetFrom={setFromRef} />
          <NearbyTransit visible={!!nearbyCoords} coords={nearbyCoords} onSelect={(point) => {
            if (setFromRef.current) setFromRef.current(point.name);
          }} />

          {loading && (
            <div className="card text-center">
              <div className="text-sm" style={{ color: '#6b7280' }}>
                <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin mr-2 align-[-3px]" />
                Searching routes...
              </div>
            </div>
          )}

          {routes.length > 0 && (
            <section className="card">
              <div className="flex justify-between items-center mb-2.5">
                <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>Cost Comparison</h2>
                <span className="badge-amber">Save {Math.round((1 - (routes[0]?.total_cost || 45) / 500) * 100)}%</span>
              </div>
              <div className="mb-2.5">
                <div className="text-[0.88rem] mb-1.5" style={{ color: '#374151' }}>Uber/Pathao (৳500)</div>
                <div className="bar-track"><div className="bar bar-uber" style={{ width: '100%' }} /></div>
              </div>
              <div>
                <div className="text-[0.88rem] mb-1.5 font-semibold" style={{ color: '#2E7D32' }}>
                  পথিক (Pathik) (৳{routes[0]?.total_cost || '?'})
                </div>
                <div className="bar-track">
                  <div className="bar bar-pathik" style={{ width: `${Math.max(3, ((routes[0]?.total_cost || 45) / 500) * 100)}%` }} />
                </div>
              </div>
            </section>
          )}

          {!loading && routes.length > 0 && (
            <section className="card">
              <h2 className="m-0 mb-3 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>Route Options</h2>
              <div className="routes-grid">
                {routes.map((route, i) => (
                  <RouteCard
                    key={i}
                    route={route}
                    index={i}
                    selected={selectedRoute === route}
                    onClick={() => setSelectedRoute(selectedRoute === route ? null : route)}
                  />
                ))}
              </div>
            </section>
          )}

          {selectedRoute && (
            <section className="card">
              <div className="flex justify-between items-center mb-3">
                <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>Selected Route Details</h2>
                <button
                  type="button"
                  onClick={() => { setAiRoute(selectedRoute); setAiQuery(searchQuery); setShowAi(true); }}
                  className="btn-secondary text-xs"
                >
                  🤖 AI Explain
                </button>
              </div>
              <RouteDetails route={selectedRoute} origin={searchQuery.split(' → ')[0]} destination={searchQuery.split(' → ')[1]} />
            </section>
          )}

          <FeedSection onOpenComments={setCommentPostId} />

          <section className="card">
            <div className="flex justify-between items-center mb-2">
              <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>🗺️ Map</h2>
            </div>
            <MapView selectedRoute={selectedRoute} />
          </section>
        </>
      )}

      {/* ===== FEED SECTION ===== */}
      {activeSection === 'feed' && (
        <FeedSection onOpenComments={setCommentPostId} />
      )}

      {/* ===== EMERGENCY SECTION ===== */}
      {activeSection === 'emergency' && (
        <section className="card" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <EmergencySection user={user} onOpenComments={setCommentPostId} />
        </section>
      )}

      {/* ===== MAP SECTION ===== */}
      {activeSection === 'map' && (
        <section className="card">
          <div className="flex justify-between items-center mb-2">
            <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>🗺️ Nearby Posts & Alerts</h2>
          </div>
          <MapView selectedRoute={selectedRoute} />
        </section>
      )}

      {/* ===== COMMUNITY SECTION ===== */}
      {activeSection === 'community' && (
        <CrowdsourceSection />
      )}

      {/* Modals */}
      {commentPostId && (
        <CommentsPanel postId={commentPostId} onClose={() => setCommentPostId(null)} />
      )}
      {showAi && (
        <AiExplainPanel route={aiRoute} query={aiQuery} onClose={() => setShowAi(false)} />
      )}
      {showChat && (
        <ChatPanel onClose={() => setShowChat(false)} />
      )}

      {/* Mobile Nav */}
      <MobileNav activeSection={activeSection} onNavigate={setActiveSection} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TransitProvider>
          <ToastContainer />
          <AppContent />
        </TransitProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')).render(<App />);
