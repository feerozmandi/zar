import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Super Admin (مدیریت ارشد)')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform operational metrics and system stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardMetrics();
  }
}
