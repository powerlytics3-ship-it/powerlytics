import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role, WorkspaceKind } from "@powerlytic/types";

export class CreateWorkspaceDto {
  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: WorkspaceKind, default: WorkspaceKind.ORGANIZATION })
  kind!: WorkspaceKind;

  @ApiPropertyOptional()
  legalName?: string;

  @ApiPropertyOptional()
  timezone?: string;
}

export class InviteMemberDto {
  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiPropertyOptional({ default: 7 })
  expiresInDays?: number;
}
