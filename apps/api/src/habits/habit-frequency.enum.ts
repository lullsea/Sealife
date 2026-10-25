// A TS enum is both a runtime object and a type, so one import works as a
// value (for @IsEnum and the entity column) and as a type annotation.
// Values match the Postgres enum type "HabitFrequency".
export enum HabitFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}
