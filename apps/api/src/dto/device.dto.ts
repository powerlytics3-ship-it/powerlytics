import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ManufactureDeviceDto {
  @ApiProperty()
  imei!: string;

  @ApiProperty()
  deviceModelVersionId!: string;

  @ApiPropertyOptional()
  serialNumber?: string;

  @ApiPropertyOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  firmwareVersion?: string;
}

export class ClaimDeviceDto {
  @ApiProperty()
  claimCode!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiPropertyOptional()
  name?: string;
}

export class DeployConfigStatusDto {
  @ApiProperty({ enum: ["applied", "error", "APPLIED", "ERROR"] })
  status!: "applied" | "error" | "APPLIED" | "ERROR";

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  configId?: string;

  @ApiPropertyOptional()
  hash?: string;
}
