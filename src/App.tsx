import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import HomeView from './components/home/HomeView';
import CubeWizard from './components/wizard/CubeWizard';
import CubeAnalysisView from './components/analysis/CubeAnalysisView';
import CardBrowser from './components/browser/CardBrowser';
import ArchetypeDashboard from './components/archetype/ArchetypeDashboard';
import ImportView from './components/import/ImportView';
import SuggestionsPanel from './components/suggestions/SuggestionsPanel';
import ExportView from './components/export/ExportView';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeView />} />
        <Route path="/wizard" element={<CubeWizard />} />
        <Route path="/analysis" element={<CubeAnalysisView />} />
        <Route path="/browser" element={<CardBrowser />} />
        <Route path="/archetype/:cubeId/:archetypeKey" element={<ArchetypeDashboard />} />
        <Route path="/import" element={<ImportView />} />
        <Route path="/suggestions" element={<SuggestionsPanel />} />
        <Route path="/export" element={<ExportView />} />
      </Route>
    </Routes>
  );
}
