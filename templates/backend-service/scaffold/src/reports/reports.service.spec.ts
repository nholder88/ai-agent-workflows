import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDefinitions', () => {
    it('returns report definitions', async () => {
      const mockReports = [
        {
          id: '1',
          name: 'Monthly Sales',
          description: 'Sales report',
          createdAt: new Date('2026-09-01'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockReports);

      const result = await service.getDefinitions();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Monthly Sales');
    });
  });

  describe('runReport', () => {
    it('returns job ID when report run starts', async () => {
      const result = await service.runReport('report-1');
      expect(result).toHaveProperty('jobId');
      expect(result.status).toBe('started');
    });
  });
});
