import type { DatabaseId } from '../types/studio';

export interface DatabaseOption {
  id: DatabaseId;
  name: string;
  description: string;
}

export const DATABASE_OPTIONS: DatabaseOption[] = [
  { id: 'postgresql', name: 'PostgreSQL', description: 'Relational database with the pg driver.' },
  { id: 'mongodb', name: 'MongoDB', description: 'Document database using the official MongoDB driver.' },
  { id: 'mysql', name: 'MySQL', description: 'Relational database through mysql2.' },
  { id: 'sqlite', name: 'SQLite', description: 'Embedded database stored in a local project file.' },
  { id: 'redis', name: 'Redis', description: 'In-memory data store using the official Redis client.' },
];
