import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  async getDefinitions() {
    const reports = await this.reportsRepository.find();
    return reports.map((report) => ({
      id: report.id,
      name: report.name,
      description: report.description,
      createdAt: report.createdAt.toISOString(),
    }));
  }

  async runReport(reportId: string) {
    const jobId = `job-${Date.now()}`;
    return { jobId, status: 'started' };
  }

  async getJobStatus(jobId: string) {
    return {
      jobId,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  }
}
