import 'dotenv/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { User } from '../users/user.entity';
import { Habit } from '../habits/habit.entity';
import { HabitCompletion } from '../habits/habit-completion.entity';
import { RefreshToken } from '../auth/refresh-token.entity';

// One config shared by the Nest app (TypeOrmModule) and the TypeORM CLI.
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Habit, HabitCompletion, RefreshToken],
  // .ts when run through ts-node (CLI), .js when run from dist/.
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  // Never let TypeORM alter the schema on its own; changes go through migrations.
  synchronize: false,
};

// The CLI (`npm run typeorm -- ...`) needs a default-exported DataSource.
export default new DataSource(dataSourceOptions);
