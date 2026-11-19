import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = {
  _id?: string;
  title: string;
  focus?: string;
  reason?: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; suggestions: Suggestion[] };

const userEmail = 'mona@example.com';

export default function Workouts() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then(({ suggestions }) => {
        if (active) setState({ status: 'loaded', suggestions });
      })
      .catch((error: unknown) => {
        if (active) {
          const detail = error instanceof Error ? error.message : 'An unknown error occurred.';
          setState({ status: 'error', message: `Unable to load workout suggestions. ${detail}` });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {state.status === 'error' && <p role="alert">{state.message}</p>}
        {state.status === 'loaded' && state.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {state.status === 'loaded' && state.suggestions.length > 0 && (
          <ul className="list-group">
            {state.suggestions.map((suggestion, index) => (
              <li className="list-group-item" key={suggestion._id ?? `${suggestion.title}-${index}`}>
                <h3 className="h6">{suggestion.title}</h3>
                {suggestion.focus && <p>Focus: {suggestion.focus}</p>}
                {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
