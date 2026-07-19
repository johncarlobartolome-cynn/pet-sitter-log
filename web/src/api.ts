const API = import.meta.env.VITE_API_URL as string;

export type Pet = { petId: string; shareToken: string };
export type Entry = { type: string; note?: string; createdAt: string };
export type Shared = {
  pet: { name: string; owner?: string; careNotes?: string; createdAt: string };
  entries: Entry[];
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const createPet = (body: { name: string; owner?: string; careNotes?: string }) =>
  fetch(`${API}/pets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json<Pet>);

// Returns void: the backend responds with { petId, type, createdAt }, but the
// caller discards it and re-fetches the list, so we don't model the body.
export const addEntry = (
  petId: string,
  body: { type: string; note?: string },
): Promise<void> =>
  fetch(`${API}/pets/${petId}/entries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json<void>);

export const listEntries = (petId: string) =>
  fetch(`${API}/pets/${petId}/entries`).then(json<{ entries: Entry[] }>);

export const getShared = (token: string) =>
  fetch(`${API}/share/${token}`).then(json<Shared>);
