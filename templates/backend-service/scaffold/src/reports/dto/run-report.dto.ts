import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RunReportDto {
  @ApiProperty({ description: 'Report ID to run' })
  @IsString()
  @IsNotEmpty()
  reportId: string;
}
