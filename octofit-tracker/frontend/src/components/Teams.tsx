import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id?: string;
  name: string;
  mascot?: string;
  members?: string[];
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => {
        if (active) setState({ status: 'loaded', teams });
      })
      .catch((error: unknown) => {
        if (active) {
          const detail = error instanceof Error ? error.message : 'An unknown error occurred.';
          setState({ status: 'error', message: `Unable to load teams. ${detail}` });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {state.status === 'loading' && <p role="status">Loading teams...</p>}
        {state.status === 'error' && <p role="alert">{state.message}</p>}
        {state.status === 'loaded' && state.teams.length === 0 && <p>No teams yet.</p>}
        {state.status === 'loaded' && state.teams.length > 0 && (
          <ul className="list-group">
            {state.teams.map((team, index) => (
              <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
                <h3 className="h6">{team.name}</h3>
                {team.mascot && <p>Mascot: {team.mascot}</p>}
                <p className="mb-0">Members: {team.members?.length ?? 0}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
