import { useNavigate } from 'react-router-dom';
import { FileUp, ArrowLeft } from 'lucide-react';

export default function ImportView() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileUp className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Import Collection</h2>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          Upload a ManaBox CSV to import your card collection.
        </p>
      </div>

      <div className="glass rounded-xl p-8 border border-border/30 max-w-md mx-auto">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4">
          <FileUp className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm mb-2">Drag & drop your CSV here, or click to browse</p>
          <p className="text-text-muted text-xs">ManaBox format CSV required</p>
        </div>
        <div className="bg-info/10 border border-info/20 rounded-lg p-3 text-info text-xs">
          Full CSV import will be available in an upcoming release. This feature will allow you to:
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Import your ManaBox collection</li>
            <li>Enrich cards via Scryfall batch endpoint</li>
            <li>Build cubes exclusively from your owned cards (Mode 1)</li>
          </ul>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 mx-auto mt-6 px-4 py-2 rounded-md text-sm text-text-secondary hover:text-text hover:bg-hover transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
    </div>
  );
}
