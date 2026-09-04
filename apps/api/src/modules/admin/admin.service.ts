import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getDashboardMetrics() {
    return {
      activeUsers: 142,
      totalAuditedBills: 874,
      totalSolarFeasibilitiesKW: 12500,
      totalCalculationsRun: 3420,
      systemHealth: '100% OPERATIONAL',
      serverLoad: '12%',
      dbConnections: 8,
      redisQueueStatus: 'HEALTHY',
    };
  }
}
