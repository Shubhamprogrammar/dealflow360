import mongoose from 'mongoose';
import { CustomerModel } from '../src/modules/customers/customer.model.js';

const run = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dealflow');
  const result = await CustomerModel.updateOne(
    { contactEmail: 'buyer@northwind.example' },
    { $set: { contactEmail: 'buyer@northwind.test' } },
  );
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  await mongoose.disconnect();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
