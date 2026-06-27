import process from "node:process";
import { db, menteeProfilesTable, mentorProfilesTable, platformUsersTable } from "../../lib/db/src";
import { hashPassword } from "../../artifacts/api-server/src/lib/adminAuth";

async function main() {
  const [emailArg, passwordArg, roleArg, ...nameParts] = process.argv.slice(2);
  const fullName = nameParts.join(" ").trim();

  if (!emailArg || !passwordArg || !roleArg || !fullName) {
    throw new Error(
      'Usage: pnpm platform:create-user "email@example.com" "secure-password" mentor "Full Name"',
    );
  }

  if (!["admin", "mentor", "mentee"].includes(roleArg)) {
    throw new Error('Role must be one of: "admin", "mentor", "mentee".');
  }

  const { hash, salt } = hashPassword(passwordArg);
  const [user] = await db
    .insert(platformUsersTable)
    .values({
      role: roleArg,
      status: "active",
      fullName,
      email: emailArg.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
    })
    .returning();

  if (roleArg === "mentor") {
    await db.insert(mentorProfilesTable).values({
      userId: user.id,
      bio: "",
      adminApproved: true,
    });
  }

  if (roleArg === "mentee") {
    await db.insert(menteeProfilesTable).values({
      userId: user.id,
      adminApproved: true,
    });
  }

  console.log(`Created ${roleArg} user #${user.id} (${user.email}).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
