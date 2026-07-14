import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Database 1: CSQNA Main Backend
const uri1 = "mongodb://127.0.0.1:27017/csqna";
const admin1 = {
  username: "admincsqna",
  first_name: "Admin",
  last_name: "CSQNA",
  email: "admincsqna@csqna.com",
  password: "LoreumYad@45637a",
  role: "0x88",
  isEmailVerified: true
};

// Database 2: CSQNA Blogs Backend
const uri2 = "mongodb://127.0.0.1:27017/csqna_blogs";
const admin2 = {
  name: "Admin",
  email: "admin@csqna.com",
  password: "Admin@123456",
  role: "admin",
  isActive: true
};

async function seedAdmin1() {
  console.log("Connecting to CSQNA Main DB...");
  const conn = await mongoose.createConnection(uri1).asPromise();
  console.log("Connected to CSQNA Main DB");
  
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false }
  }, { strict: false });

  const User = conn.model('Users', UserSchema);

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(admin1.password, salt);

  const updateData = {
    ...admin1,
    password: hashedPassword
  };

  const res = await User.findOneAndUpdate(
    { email: admin1.email },
    updateData,
    { upsert: true, new: true }
  );
  console.log("Successfully seeded CSQNA Main Admin:", res.email);
  await conn.close();
}

async function seedAdmin2() {
  console.log("Connecting to CSQNA Blogs DB...");
  const conn = await mongoose.createConnection(uri2).asPromise();
  console.log("Connected to CSQNA Blogs DB");

  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: 'author' },
    isActive: { type: Boolean, default: true }
  }, { strict: false });

  const User = conn.model('User', UserSchema);

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(admin2.password, salt);

  const updateData = {
    ...admin2,
    password: hashedPassword
  };

  const res = await User.findOneAndUpdate(
    { email: admin2.email },
    updateData,
    { upsert: true, new: true }
  );
  console.log("Successfully seeded CSQNA Blogs Admin:", res.email);
  await conn.close();
}

async function main() {
  try {
    await seedAdmin1();
    await seedAdmin2();
    console.log("All Admins Seeded Successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

main();
