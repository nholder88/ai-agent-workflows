import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('feature-flags')
  @ApiOperation({ summary: 'Get all feature flags' })
  getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
