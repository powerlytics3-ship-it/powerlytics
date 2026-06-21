import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class IngestTelemetryDto {
  @ApiPropertyOptional()
  deviceId?: string;

  @ApiPropertyOptional()
  ts?: string;

  @ApiProperty({
    example: {
      DI_1: 1,
      AI_1: 72.4,
      MI_1: [{ slave_id: 1, registers: [{ readId: "read-voltage-l1", value: [231] }] }]
    }
  })
  values!: Record<string, unknown>;
}
