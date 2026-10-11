// Add a user, or reset an existing user's password: npm run user -- <username>
import { createInterface } from "node:readline/promises";
import postgres from "postgres";

const name = process.argv[2]?.trim().toLowerCase();
if (!name) throw new Error("Usage: npm run user -- <username>");

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
process.stdout.write(`Password for ${name} (8+ chars): `);
(rl as unknown as { _writeToOutput: () => void })._writeToOutput = () => {}; // don't echo the password
const pw = await rl.question("");
rl.close();
console.log();
if (pw.length < 8) throw new Error("Password needs at least 8 characters");

const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
const [reset] = await sql`
  update users set password_hash = crypt(${pw}, gen_salt('bf', 10)), session_version = session_version + 1,
                   failed_logins = 0, locked_until = null
  where username = ${name} returning id`;
if (reset) console.log(`✓ password reset for ${name}`);
else {
  const [slot] = await sql`select s from generate_series(1, 3) s where s not in (select id from users) limit 1`;
  if (!slot) {
    console.error("Already 3 users. Remove one first: delete from users where username = '<name>';");
    process.exitCode = 1;
  } else {
    await sql`insert into users (id, username, password_hash) values (${slot.s}, ${name}, crypt(${pw}, gen_salt('bf', 10)))`;
    console.log(`✓ added ${name} (user ${slot.s} of 3)`);
  }
}
await sql.end();
