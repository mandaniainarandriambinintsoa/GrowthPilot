import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Generate } from './pages/Generate';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <div className="min-h-screen bg-surface">
          <Navbar />
          <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </ProjectProvider>
    </BrowserRouter>
  );
}
