import argon2 from 'argon2';
import { connectDatabase, disconnectDatabase } from '../src/config/index.js';
import { UserModel } from '../src/modules/users/user.model.js';

const run = async (): Promise<void> => {
  await connectDatabase();
  
  const passwordHash = await argon2.hash('dealflow');

  const users = [
    {
      firstName: 'Sally',
      lastName: 'Sales',
      email: 'rep@dealflow.com',
      passwordHash,
      role: 'sales_rep',
      team: 'North America',
    },
    {
      firstName: 'Manny',
      lastName: 'Manager',
      email: 'manager@dealflow.com',
      passwordHash,
      role: 'sales_manager',
      team: 'North America',
    },
    {
      firstName: 'Fiona',
      lastName: 'Finance',
      email: 'finance@dealflow.com',
      passwordHash,
      role: 'finance',
    }
  ];

  for (const u of users) {
    if (!(await UserModel.findOne({ email: u.email }).exec())) {
      await UserModel.create(u);
      console.log(`Created ${u.role}: ${u.email}`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }

  await disconnectDatabase();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
