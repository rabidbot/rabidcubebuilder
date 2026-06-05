import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Clipboard, FileText } from 'lucide-react';
import { useCubeStore } from '../../stores/cubeStore';
import { useToastStore } from '../../stores/toastStore';
import { serializeCSV } from '../../lib/csv-parser';
import { isElectron } from '../../lib/electron-api';

export default function ExportView() {
  const navigate = useNavigate();
  const cube = useCubeStore((s) => s.cube);
  const addToast = useToastStore((s) => s.addToast);
  const [format, setFormat] = useState<'cubeCobra' | 'manaBox' | 'text'>('cubeCobra');

  if (!cube) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Download className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">No Cube to Export</h2>
        <p className="text-text-secondary mb-4">Build a cube first.</p>
        <button onClick={() => navigate('/wizard')} className="px-4 py-2 rounded-md bg-primary text-black font-medium hover:bg-primary-light">
          Go to Builder
        </button>
      </div>
    );
  }

  const generateContent = (): string => {
    switch (format) {
      case 'cubeCobra': {
        const headers = ['name', 'cmc', 'type', 'color', 'set', 'collector_number', 'status', 'tags'];
        const rows = cube.cubeCards.map((cc) => {
          const fits = cc.archetypeFits.filter((f) => f.score >= 0.15).map((f) => f.archetype);
          return {
            name: cc.scryfallData.name,
            cmc: String(cc.scryfallData.cmc || 0),
            type: cc.scryfallData.type_line || '',
            color: (cc.scryfallData.colors || []).join(''),
            set: cc.scryfallData.set || '',
            collector_number: cc.scryfallData.collector_number || '',
            status: 'Not Owned',
            tags: fits.join(';'),
          };
        });
        return serializeCSV(headers, rows);
      }
      case 'manaBox': {
        const headers = ['Name', 'Set Code', 'Collector Number', 'Quantity', 'Foil', 'Condition', 'Language'];
        const rows = cube.cubeCards.map((cc) => ({
          Name: cc.scryfallData.name,
          'Set Code': cc.scryfallData.set || '',
          'Collector Number': cc.scryfallData.collector_number || '',
          Quantity: '1',
          Foil: 'FALSE',
          Condition: 'NM',
          Language: 'English',
        }));
        return serializeCSV(headers, rows);
      }
      case 'text': {
        const grouped: Record<string, string[]> = {};
        for (const cc of cube.cubeCards) {
          const color = (cc.scryfallData.colors || []).join('') || 'Colorless';
          if (!grouped[color]) grouped[color] = [];
          grouped[color].push(`  ${cc.scryfallData.name} [${cc.scryfallData.cmc}] ${cc.scryfallData.type_line || ''}`);
        }
        let out = `${cube.name}\n${cube.cubeCards.length} cards\n\n`;
        for (const [color, cards] of Object.entries(grouped).sort()) {
          out += `${color}:\n${cards.join('\n')}\n\n`;
        }
        return out;
      }
    }
  };

  const content = generateContent();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      addToast('Copied to clipboard', 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleDownload = async () => {
    const ext = format === 'text' ? 'txt' : 'csv';
    const filename = `cube-${cube.name.replace(/\s+/g, '-').toLowerCase()}.${ext}`;

    if (isElectron()) {
      const path = await window.electronAPI.dialog.saveFile(filename);
      if (path) {
        const result = await window.electronAPI.fs.writeFile(path, content);
        if (result.ok) {
          addToast('Saved!', 'success');
        } else {
          addToast(`Failed: ${result.error}`, 'error');
        }
      }
    } else {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Downloaded!', 'success');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/analysis')} className="p-2 rounded-md hover:bg-hover text-text-secondary hover:text-text">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text">Export Cube</h1>
      </div>

      <div className="glass rounded-xl p-6 border border-border/30 mb-6">
        <h3 className="text-lg font-bold text-text mb-4">Format</h3>
        <div className="flex gap-3">
          {([
            { key: 'cubeCobra', label: 'CubeCobra', desc: 'Import into CubeCobra.com' },
            { key: 'manaBox', label: 'ManaBox', desc: 'Import into ManaBox app' },
            { key: 'text', label: 'Plain Text', desc: 'Readable card list' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={`flex-1 p-4 rounded-lg border transition-all text-left ${
                format === f.key
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border-light bg-card'
              }`}
            >
              <div className="text-text font-medium text-sm">{f.label}</div>
              <div className="text-text-muted text-xs mt-1">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-border/30 mb-6">
        <h3 className="text-lg font-bold text-text mb-4">Preview</h3>
        <pre className="bg-card border border-border rounded-lg p-4 text-text-secondary text-xs max-h-96 overflow-auto whitespace-pre-wrap">
          {content.slice(0, 5000)}
          {content.length > 5000 && '\n\n... (truncated)'}
        </pre>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-card border border-border text-text text-sm hover:bg-hover transition-colors"
        >
          <Clipboard className="w-4 h-4" /> Copy to Clipboard
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-2 rounded-md bg-primary text-black font-medium text-sm hover:bg-primary-light transition-colors"
        >
          <FileText className="w-4 h-4" /> Download File
        </button>
      </div>
    </div>
  );
}
