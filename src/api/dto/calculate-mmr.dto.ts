import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AscendancyDataDto } from './ascendancy-data.dto';

export class CalculateMmrDto {
  @IsString()
  @IsNotEmpty()
  guildId: string;

  @ValidateNested()
  @Type(() => AscendancyDataDto)
  ascendancyData: AscendancyDataDto;
}
