import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';

export class AnalyzeBillDto {
  billIdentifier!: string;
  tariffType!: 'INDUSTRIAL' | 'COMMERCIAL' | 'AGRICULTURAL';
  contractDemandKW!: number;
  peakMeasuredKW!: number;
  lowLoadKWh!: number;
  midLoadKWh!: number;
  peakLoadKWh!: number;
  reactiveKWh!: number;
}

@ApiTags('Smart Energy Audit (ممیزی و تحلیل قبض)')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze electricity bill parameters and calculate penalties & savings' })
  @ApiResponse({ status: 200, description: 'Bill analyzed successfully' })
  async analyze(@Body() dto: AnalyzeBillDto) {
    return this.auditService.analyzeBill(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get sample audit history for current workspace' })
  async getHistory() {
    return this.auditService.getAuditHistory();
  }
}
