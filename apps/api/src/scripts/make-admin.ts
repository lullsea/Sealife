// src/scripts/make-admin.ts
// Usage (from apps/api): npm run make-admin -- alice@test.com
// Uses the same DataSource as the TypeORM CLI: no Nest app and no HTTP,
// so nothing outside this machine can reach it.
import dataSource from '../database/data-source';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.entity';

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error('Usage: npm run make-admin -- <email>');
  }

  await dataSource.initialize();
  try {
    const { affected } = await dataSource
      .getRepository(User)
      .update({ email }, { role: UserRole.ADMIN });
    console.log(
      affected ? `${email} is now ADMIN` : `No user with email ${email}`,
    );
  } finally {
    // Without this, the open connection pool keeps Node running and the script never exits.
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
