import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; activities: Activity[] };

export default function Activities() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => {
        if (active) setState({ status: 'loaded', activities });
      })
      .catch((error: unknown) => {
        if (active) {
          const detail = error instanceof Error ? error.message : 'An unknown error occurred.';
          setState({ status: 'error', message: `Unable to load activities. ${detail}` });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {state.status === 'loading' && <p role="status">Loading activities...</p>}
        {state.status === 'error' && <p role="alert">{state.message}</p>}
        {state.status === 'loaded' && state.activities.length === 0 && <p>No activities yet.</p>}
        {state.status === 'loaded' && state.activities.length > 0 && (
          <ul className="list-group">
            {state.activities.map((activity, index) => (
              <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
                <h3 className="h6 text-capitalize">{activity.type}</h3>
                <p className="mb-0">{activity.minutes} minutes - {activity.points} points</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
