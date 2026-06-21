import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { telemetryIngestSchema } from "@powerlytic/validators";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller()
export class TelemetryController {
  constructor(private readonly state: AppStateService) {}

  @Post("telemetry/devices/:deviceId/values")
  @RequirePermission(Permission.TELEMETRY_INGEST)
  async ingest(@Param("deviceId") deviceId: string, @Body() body: unknown) {
    return { success: true, data: await this.state.ingestTelemetry(deviceId, telemetryIngestSchema.parse(body)) };
  }

  @Post("values/devices/:deviceId")
  @RequirePermission(Permission.TELEMETRY_INGEST)
  async legacyIngest(@Param("deviceId") deviceId: string, @Body() body: unknown) {
    return this.ingest(deviceId, body);
  }

  @Get("devices/:deviceId/values")
  @RequirePermission(Permission.TELEMETRY_READ)
  async values(@Param("deviceId") deviceId: string, @Query() query: Record<string, unknown>) {
    const data = await this.state.listTelemetry(deviceId, query);
    return { success: true, count: data.length, data };
  }

  @Get("devices/:deviceId/values/latest")
  @RequirePermission(Permission.TELEMETRY_READ)
  latest(@Param("deviceId") deviceId: string) {
    return this.state.latestTelemetry(deviceId);
  }

  @Get("devices/:deviceId/values/snapshot")
  snapshot(@Param("deviceId") deviceId: string) {
    return this.latest(deviceId);
  }

  @Get("devices/:deviceId/values/table")
  table(@Param("deviceId") deviceId: string, @Query() query: Record<string, unknown>) {
    return this.values(deviceId, query);
  }

  @Get("devices/:deviceId/values/timeseries/:portKey")
  timeseries(@Param("deviceId") deviceId: string, @Param("portKey") portKey: string, @Query() query: Record<string, unknown>) {
    return this.values(deviceId, { ...query, portKey });
  }

  @Get("devices/:deviceId/values/timeseries/modbus/:readId")
  modbusTimeseries(@Param("deviceId") deviceId: string, @Param("readId") readId: string, @Query() query: Record<string, unknown>) {
    return this.values(deviceId, { ...query, readId });
  }

  @Get("devices/:deviceId/values/stats/:portKey")
  @RequirePermission(Permission.TELEMETRY_READ)
  async stats(@Param("deviceId") deviceId: string, @Param("portKey") portKey: string) {
    const telemetry = await this.state.listTelemetry(deviceId, { portKey });
    const values = telemetry.filter((row) => typeof row.calibratedValue === "number");
    const numbers = values.map((row) => Number(row.calibratedValue));
    return {
      success: true,
      data: {
        count: numbers.length,
        min: numbers.length ? Math.min(...numbers) : null,
        max: numbers.length ? Math.max(...numbers) : null,
        avg: numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null,
        lastValue: numbers.at(0) ?? null,
        lastTimestamp: values.at(0)?.ts ?? null
      }
    };
  }

  @Get("devices/:deviceId/values/status")
  @RequirePermission(Permission.TELEMETRY_READ)
  async status(@Param("deviceId") deviceId: string) {
    const latest = await this.state.latestTelemetry(deviceId);
    return { success: true, deviceId, latestCount: latest.length, health: latest.length ? "ONLINE" : "UNKNOWN" };
  }

  @Get("devices/:deviceId/values/export")
  export(@Param("deviceId") deviceId: string, @Query() query: Record<string, unknown>) {
    return this.values(deviceId, query);
  }
}
