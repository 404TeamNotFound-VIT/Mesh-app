import { db, type MeshMessage } from './database';

export async function saveMessage(msg: MeshMessage): Promise<void> {
  await db.messages.put(msg);
}

export async function getMessagesByMesh(meshId: string): Promise<MeshMessage[]> {
  return await db.messages.where('meshId').equals(meshId).sortBy('timestamp');
}

export async function markMessageDelivered(msgId: string): Promise<void> {
  await db.messages.update(msgId, { status: 'delivered' });
}
