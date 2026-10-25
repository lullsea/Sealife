import {
  Body,
  Controller,
  Get,
  Put,
  Param,
  ParseIntPipe,
  Post,
  Delete,
} from '@nestjs/common';
import type { Habit } from './habit.entity';
import type { HabitCompletion } from './habit-completion.entity';
import { HabitsService } from './habits.service';
import { CreateHabitDTO } from './dto/create-habit';
import { UpdateHabitDTO } from './dto/update-habit';

// HTTP layer only: map routes to service calls. Every route here starts with /habits.
@Controller('habits')
export class HabitsController {
  // Nest injects the HabitsService instance (Dependency Injection, next lesson).
  constructor(private readonly habitsService: HabitsService) {}

  // GET /habits
  @Get()
  findAll(): Promise<Habit[]> {
    return this.habitsService.findAll();
  }

  // GET /habits/:id. URL params are strings; ParseIntPipe converts to a number
  // and returns 400 if it isn't one.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Habit> {
    return this.habitsService.findOne(id);
  }

  // POST /habits with body { "name": "...", "description"?: "..." }
  @Post()
  create(@Body() dto: CreateHabitDTO): Promise<Habit> {
    return this.habitsService.create(dto);
  }

  // POST /habits with body { "name": "...", "description"?: "..." }
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHabitDTO,
  ): Promise<Habit> {
    return this.habitsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.habitsService.delete(id);
  }
  // POST /habits/:id/complete. Records one completion; 404 if the habit is missing.
  @Post(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number): Promise<HabitCompletion> {
    return this.habitsService.complete(id);
  }
  // GET /habits/:id/completions, newest first.
  @Get(':id/completions')
  findCompletions(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HabitCompletion[]> {
    return this.habitsService.findCompletions(id);
  }
}
