import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = import.meta.env.VITE_SUPABASE_CONNECTION_URL;
if (!connectionString) {
  throw new Error('VITE_SUPABASE_CONNECTION_URL is not set');
}
const client = postgres(connectionString);
export const db = drizzle(client);
