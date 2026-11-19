import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setState({ status: 'loaded', leaderboard });
      })
      .catch((error: unknown) => {
        if (active) {
          const detail = error instanceof Error ? error.message : 'An unknown error occurred.';
          setState({ status: 'error', message: `Unable to load leaderboard. ${detail}` });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {state.status === 'error' && <p role="alert">{state.message}</p>}
        {state.status === 'loaded' && state.leaderboard.length === 0 && <p>No leaderboard results yet.</p>}
        {state.status === 'loaded' && state.leaderboard.length > 0 && (
          <ol className="list-group list-group-numbered">
            {state.leaderboard.map((entry) => (
              <li className="list-group-item" key={`${entry.rank}-${entry.teamName}`}>
                <span>{entry.teamName}</span>
                <span className="ms-2">{entry.totalPoints} points</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
