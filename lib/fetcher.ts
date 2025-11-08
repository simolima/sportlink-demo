export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers||{}) } });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}