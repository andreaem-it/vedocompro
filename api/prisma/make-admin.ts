import { PrismaClient } from '@prisma/client';

/**
 * Bootstrap del primo amministratore: attiva l'account e assegna isAdmin.
 * Da usare quando non esiste ancora nessun admin che possa promuovere altri
 * (es. subito dopo il primo deploy, con SMTP non ancora configurato).
 *
 * Uso:
 *   DATABASE_URL=<url> npx tsx prisma/make-admin.ts email@esempio.it
 */
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Uso: npx tsx prisma/make-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, username: true, isActive: true, isAdmin: true } });
  if (!user) {
    console.error(`Nessun utente con email ${email}. Registrati prima dal sito, poi rilancia questo script.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { isActive: true, isAdmin: true },
  });

  console.log(`✔ @${user.username} (${email}) è ora attivo e amministratore.`);
  console.log('  Può accedere al pannello /admin e attivare/promuovere altri utenti dalla UI.');
}

main()
  .catch((err) => {
    console.error('Errore:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
