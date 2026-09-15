import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getFeatureFlags() {
    return [
      {
        key: 'new-reports-ui',
        description: 'Enable new reports UI',
        enabled: true,
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'advanced-filtering',
        description: 'Enable advanced filtering',
        enabled: false,
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  getAuditLogs() {
    return {
      logs: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
  }
}
