import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateGuildDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsNumber()
  @IsInt()
  @Min(0)
  memberCount: number;

  @IsString()
  @IsOptional()
  icon?: string;
}
