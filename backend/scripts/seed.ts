import argon2 from 'argon2';
import { connectDatabase, disconnectDatabase, env } from '../src/config/index.js';
import { UserModel } from '../src/modules/users/user.model.js';
const run = async (): Promise<void> => {
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD)
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  await connectDatabase();
  if (!(await UserModel.findOne({ email: env.SEED_ADMIN_EMAIL }).exec()))
    await UserModel.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: env.SEED_ADMIN_EMAIL,
      passwordHash: await argon2.hash(env.SEED_ADMIN_PASSWORD),
      role: 'admin',
    });
  await disconnectDatabase();
};
run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
