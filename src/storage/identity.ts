import { v4 as uuidv4 } from 'uuid';
import { db, type Identity } from './database';

export async function getOrCreateIdentity(): Promise<Identity> {
  const existing = await db.identity.get('self');
  if (existing) return existing;

  const newIdentity: Identity = {
    id: 'self',
    nodeId: `node_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
    displayName: `User_${Math.floor(Math.random() * 1000)}`,
    createdAt: Date.now(),
  };

  await db.identity.put(newIdentity);
  return newIdentity;
}

export async function getIdentity(): Promise<Identity | undefined> {
  return await db.identity.get('self');
}

export async function updateDisplayName(name: string): Promise<void> {
  const ident = await db.identity.get('self');
  if (ident) {
    ident.displayName = name;
    await db.identity.put(ident);
  }
}
