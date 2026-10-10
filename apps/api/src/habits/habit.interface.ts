// Plain shape for now. Becomes a Prisma model in Stage 2.
export interface Habit {
  id: number;
  name: string;
  createdAt: Date;
  description?: string;
}
