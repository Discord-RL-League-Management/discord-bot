import { StringOption } from 'necord';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * RegisterDto - DTO for /register command arguments
 *
 * Defines the options for users to register their own tracker URLs.
 * Supports 1-4 tracker URLs as separate optional string options.
 */
export class RegisterDto {
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
