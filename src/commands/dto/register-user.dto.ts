import { UserOption, StringOption } from 'necord';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { User } from 'discord.js';

/**
 * RegisterUserDto - DTO for /register-user command arguments
 *
 * Defines the options for staff to register a user with tracker URLs.
 * Supports 1-4 tracker URLs as separate optional string options.
 */
export class RegisterUserDto {
  @UserOption({
    name: 'user',
    description: 'The user to register with tracker URLs',
    required: true,
  })
  @IsObject()
  @Type(() => Object)
  user: User;

  @StringOption({
    name: 'url1',
    description: 'First tracker URL (required)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  url1: string;

  @StringOption({
    name: 'url2',
    description: 'Second tracker URL (optional)',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  url2?: string;

  @StringOption({
    name: 'url3',
    description: 'Third tracker URL (optional)',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  url3?: string;

  @StringOption({
    name: 'url4',
    description: 'Fourth tracker URL (optional)',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  url4?: string;
}
