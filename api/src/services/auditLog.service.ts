import { prisma } from '../lib/prisma';

/** Scrive un record AdminAction; non deve mai far fallire l'operazione principale. */
export async function logAdminAction(adminUserId: number, type: number): Promise<void> {
  await prisma.adminAction.create({ data: { userId: adminUserId, type } }).catch(() => {});
}
