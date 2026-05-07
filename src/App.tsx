import { useState } from 'react';

import { PlateVisualizer } from './features/plate/PlateVisualizer';
import { buildInfo } from './generated/build-info';
import { registerServiceWorker } from './lib/pwa';

registerServiceWorker();

export function App() {
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <PlateVisualizer buildInfo={buildInfo} onError={setError} />
      {error ? (
        <div className="toast" role="status" aria-live="polite">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            Dismiss
          </button>
        </div>
      ) : null}
    </>
  );
}
