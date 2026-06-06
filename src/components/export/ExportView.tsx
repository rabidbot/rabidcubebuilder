import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clipboard, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCubeStore } from '../../stores/cubeStore';
import { useToastStore } from '../../stores/toastStore';
import { serializeCSV } from '../../lib/csv-parser';
import { isElectron } from '../../lib/electron-api';

export default function ExportView() {
  const navigate = useNavigate();
  const cube = useCubeStore((s) => s.cube);
  const addToast = useToastStore((s) => s.addToast);
  const [format, setFormat] = useState<'cubeCobra' | 'manaBox' | 'text'>('cubeCobra');

  const { content, lineCount, charCount, totalCards, stats } = useMemo(() => {
    if (!cube) return { content: '', lineCount: 0, charCount: 0, totalCards: 0, stats: '' };

    const totalCards = cube.cubeCards.length;
    let content = '';
    let stats = '';

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
        content = serializeCSV(headers, rows);
        stats = `CSV rows: ${rows.length}`;
        break;
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
        content = serializeCSV(headers, rows);
        stats = `CSV rows: ${rows.length}`;
        break;
      }
      case 'text': {
        const grouped: Record<string, string[]> = {};
        for (const cc of cube.cubeCards) {
          const color = (cc.scryfallData.colors || []).join('') || 'Colorless';
          if (!grouped[color]) grouped[color] = [];
          grouped[color].push(`  ${cc.scryfallData.name} [${cc.scryfallData.cmc}] ${cc.scryfallData.type_line || ''}`);
        }

        const colorCounts = Object.entries(grouped)
          .map(([c, cards]) => `${c}:${cards.length}`)
          .join(', ');

        let out = `${cube.name}\n${totalCards} cards\n\n`;
        for (const [color, cards] of Object.entries(grouped).sort()) {
          out += `${color}:\n${cards.join('\n')}\n\n`;
        }
        content = out;
        stats = `Colors — ${colorCounts}`;
        break;
      }
    }

    const lineCount = content.split('\n').length;
    const charCount = content.length;

    console.log('[Export] format:', format);
    console.log('[Export] cubeCards.length:', totalCards);
    console.log('[Export] content chars:', charCount);
    console.log('[Export] content lines:', lineCount);
    console.log('[Export] stats:', stats);

    return { content, lineCount, charCount, totalCards, stats };
  }, [cube, format]);

  if (!cube) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">No Cube to Export</h2>
        <p className="text-text-secondary mb-4">Build a cube first.</p>
        <button onClick={() => navigate('/wizard')} className="px-4 py-2 rounded-md bg-primary text-black font-medium hover:bg-primary-light">
          Go to Builder
        </button>
      </div>
    );
  }

  const handleCopy = async () => {
    console.log('[Export] copy — chars:', content.length, 'lines:', content.split('\n').length);
    try {
      await navigator.clipboard.writeText(content);
      addToast(`Copied ${totalCards} cards`, 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleDownload = async () => {
    const ext = format === 'text' ? 'txt' : 'csv';
    const safeName = cube.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().replace(/-+/g, '-');
    const filename = `cube-${safeName}.${ext}`;

    console.log('[Export] download — chars:', content.length, 'lines:', content.split('\n').length);

    if (isElectron()) {
      console.log('[Export] electron save dialog...');
      const path = await window.electronAPI.dialog.saveFile(filename);
      if (path) {
        console.log('[Export] writing to:', path);
        const result = await window.electronAPI.fs.writeFile(path, content);
        if (result.ok) {
          addToast(`Saved ${totalCards} cards to ${path.split(/[/\\]/).pop()}`, 'success');
        } else {
          addToast(`Write failed: ${result.error}`, 'error');
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
      addToast(`Downloaded ${totalCards} cards`, 'success');
    }
  };

  const cardLinesMatch = format === 'text'
    ? lineCount >= totalCards + 10
    : lineCount >= totalCards + 1;

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">Preview</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-text-muted">
              {totalCards} cards &middot; {lineCount} lines &middot; {(charCount / 1024).toFixed(1)} KB
            </span>
            <span className={`flex items-center gap-1 font-medium ${
              cardLinesMatch ? 'text-success' : 'text-danger'
            }`}>
              {cardLinesMatch
                ? <><CheckCircle className="w-3.5 h-3.5" /> Complete</>
                : <><AlertTriangle className="w-3.5 h-3.5" /> Mismatch</>
              }
            </span>
          </div>
        </div>
        {!cardLinesMatch && (
          <div className="mb-3 p-3 rounded-lg border border-danger/30 bg-danger/5 text-danger text-xs">
            Expected {totalCards} card lines but got {lineCount} total lines. Check the console for diagnostics.
          </div>
        )}
        <div className="bg-card border border-border rounded-lg p-4 text-text-secondary text-xs text-mono mb-2">
          {stats}
        </div>
        <pre className="bg-card border border-border rounded-lg p-4 text-text-secondary text-xs max-h-96 overflow-auto whitespace-pre-wrap">
          {content.length > 5000 ? content.slice(0, 5000) + '\n\n... (truncated for preview — file will be complete)' : content}
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
