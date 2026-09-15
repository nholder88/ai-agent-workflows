import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RunReportDto } from './dto/run-report.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('definitions')
  @ApiOperation({ summary: 'Get all report definitions' })
  getDefinitions() {
    return this.reportsService.getDefinitions();
  }

  @Post('run')
  @ApiOperation({ summary: 'Run a report' })
  runReport(@Body() dto: RunReportDto) {
    return this.reportsService.runReport(dto.reportId);
  }

  @Get(':jobId/status')
  @ApiOperation({ summary: 'Get report job status' })
  getJobStatus(@Param('jobId') jobId: string) {
    return this.reportsService.getJobStatus(jobId);
  }
}
