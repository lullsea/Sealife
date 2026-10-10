import { Injectable, NotFoundException } from '@nestjs/common';
import type { Habit } from './habit.interface';
import { CreateHabitDTO } from './dto/create-habit';

// Business logic lives here. No HTTP concepts (requests, status codes, routes).
// @Injectable() lets Nest create this class and inject it into others.
@Injectable()
export class HabitsService {
  // In-memory storage. Resets on every restart; replaced by a database in Stage 2.
  private habits: Habit[] = [];
  private nextId = 1;

  findAll(): Habit[] {
    return this.habits;
  }

  findOne(id: number): Habit {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) {
      // Nest turns this into a 404 response automatically.
      throw new NotFoundException(`Habit ${id} not found`);
    }
    return habit;
  }

  create(dto: CreateHabitDTO): Habit {
    const habit: Habit = {
      id: this.nextId++,
      name: dto.name,
      description: dto.description,
      createdAt: new Date(),
    };
    this.habits.push(habit);
    return habit;
  }
}
