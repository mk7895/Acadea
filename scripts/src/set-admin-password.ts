import process from "node:process";
import { db, adminCredentialsTable } from "../../lib/db/src";
import { hashPassword } from "../../artifacts/api-server/src/lib/adminAuth";

async function main() {
  const password = process.argv[2]?.trim();

  if (!password) {
    throw new Error('Usage: pnpm admin:set-password "your-secure-password"');
  }

  const { hash, salt } = hashPassword(password);

  await db
    .insert(adminCredentialsTable)
    .values({
      id: 1,
      passwordHash: hash,
      passwordSalt: salt,
    })
    .onConflictDoUpdate({
      target: adminCredentialsTable.id,
      set: {
        passwordHash: hash,
        passwordSalt: salt,
        updatedAt: new Date(),
      },
    });

  console.log("Admin password updated.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
