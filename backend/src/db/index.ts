import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema.ts';
import { databaseUrl } from '../config.ts';

export const db = drizzle(databaseUrl, { schema });
