import { IntegerOption } from 'necord';
import { IsNumber, IsInt, Min } from 'class-validator';

/**
 * CalculateMmrAscendancyDto - DTO for /calculate-mmr-ascendancy command arguments
 *
 * Defines the options for calculating MMR using the ASCENDANCY algorithm.
 * All 8 fields are required integer values >= 0.
 */
export class CalculateMmrAscendancyDto {
  @IntegerOption({
    name: '2scurrentrank',
    description: '2s Current Rank',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '2sCurrentRank': number;

  @IntegerOption({
    name: '2speakrank',
    description: '2s Peak Rank',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '2sPeakRank': number;

  @IntegerOption({
    name: '2scurrentgames',
    description: '2s Current Games',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '2sCurrentGames': number;

  @IntegerOption({
    name: '2spreviousgames',
    description: '2s Previous Games',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '2sPreviousGames': number;

  @IntegerOption({
    name: '3scurrentrank',
    description: '3s Current Rank',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '3sCurrentRank': number;

  @IntegerOption({
    name: '3speakrank',
    description: '3s Peak Rank',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '3sPeakRank': number;

  @IntegerOption({
    name: '3scurrentgames',
    description: '3s Current Games',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '3sCurrentGames': number;

  @IntegerOption({
    name: '3spreviousgames',
    description: '3s Previous Games',
    required: true,
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  '3sPreviousGames': number;
}
