import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { CreateHabitDTO } from './dto/create-habit.dto';
import { UpdateHabitDTO } from './dto/update-habit.dto';
import type { AuthUser } from '../auth/jwt-payload';
import { CurrentUser } from '../auth/current-user.decorator';

// HTTP layer only: map routes to service calls. Every route here starts with /habits.
@ApiBearerAuth() // Requires an authentication token to access this namespace
@ApiTags('habits') // Swagger Namespacing
@Controller('habits')
export class HabitsController {
  // Nest injects the HabitsService instance (Dependency Injection, next lesson).
  constructor(private readonly habitsService: HabitsService) {}

  // GET /habits
  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<Habit[]> {
    return this.habitsService.findAll(user.id);
  }

  // GET /habits/:id. URL params are strings; ParseIntPipe converts to a number
  // and returns 400 if it isn't one.
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<Habit> {
    return this.habitsService.findOne(id, user.id);
  }

  // POST /habits with body { "name": "...", "description"?: "..." }
  @Post()
  create(
    @Body() dto: CreateHabitDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<Habit> {
    return this.habitsService.create(user.id, dto);
  }

  // PUT /habits with body { "name": "...", "description"?: "..." }
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHabitDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<Habit> {
    return this.habitsService.update(id, user.id, dto);
  }

  // DELETE habit
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.habitsService.delete(id, user.id);
  }
  // POST /habits/:id/complete. Records one completion; 404 if the habit is missing.
  @Post(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<HabitCompletion> {
    return this.habitsService.complete(id, user.id);
  }
  // GET /habits/:id/completions, newest first.
  @Get(':id/completions')
  findCompletions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<HabitCompletion[]> {
    return this.habitsService.findCompletions(id, user.id);
  }
}
