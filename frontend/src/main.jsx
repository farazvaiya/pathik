import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { AuthProvider } from './context/AuthContext';
import AuthSection from './components/AuthSection';
import FeedSection from './components/FeedSection';
import CrowdsourceSection from './components/CrowdsourceSection';
import { ToastContainer } from './components/Toast';

function Mounts() {
  const authRoot = document.getElementById('auth-root');
  const feedRoot = document.getElementById('feed-react-root');
  const crowdRoot = document.getElementById('crowdsource-root');

  return (
    <>
      {authRoot && createPortal(<AuthSection />, authRoot)}
      {feedRoot && createPortal(<FeedSection />, feedRoot)}
      {crowdRoot && createPortal(<CrowdsourceSection />, crowdRoot)}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <Mounts />
    </AuthProvider>
  );
}

const bootstrap = document.getElementById('pathik-react-bootstrap');
if (bootstrap) {
  createRoot(bootstrap).render(<App />);
}
