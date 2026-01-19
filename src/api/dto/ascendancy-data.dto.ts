import { IsNumber, IsInt, Min } from 'class-validator';

export class AscendancyDataDto {
  @IsNumber()
  @IsInt()
  @Min(0)
  rank2sCurrent: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  rank2sPeak: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  games2sCurrent: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  games2sPrevious: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  rank3sCurrent: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  rank3sPeak: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  games3sCurrent: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  games3sPrevious: number;
}
