import * as dotenv from 'dotenv';
import { defineConfig } from "drizzle-kit";

dotenv.config();

export default defineConfig({
  dialect: 'postgresql',
  schema: './app/db/schema.ts',
  out: "./app/db/migrations",
  dbCredentials: {
    url: process.env.VITE_SUPABASE_CONNECTION_URL!,
  }
})
