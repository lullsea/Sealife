import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import type { Habit } from './habit.interface';
import { HabitsService } from './habits.service';
import { CreateHabitDTO } from './dto/create-habit';

// HTTP layer only: map routes to service calls. Every route here starts with /habits.
@Controller('habits')
export class HabitsController {
  // Nest injects the HabitsService instance (Dependency Injection, next lesson).
  constructor(private readonly habitsService: HabitsService) {}

  // GET /habits
  @Get()
  findAll(): Habit[] {
    return this.habitsService.findAll();
  }

  // GET /habits/:id. URL params are strings; ParseIntPipe converts to a number
  // and returns 400 if it isn't one.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Habit {
    return this.habitsService.findOne(id);
  }

  // POST /habits with body { "name": "..." }
  // TODO(Stage 1: DTOs + Validation): replace this inline type with a CreateHabitDto.
  @Post()
  create(@Body() dto: CreateHabitDTO): Habit {
    return this.habitsService.create(dto);
  }
}
