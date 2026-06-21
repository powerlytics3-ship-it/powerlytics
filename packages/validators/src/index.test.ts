import { describe, expect, it } from "vitest";
import { telemetryIngestSchema, portTypeSchema } from "./index";

describe("validators", () => {
  it("accepts the legacy telemetry payload shape", () => {
    const parsed = telemetryIngestSchema.parse({
      deviceId: "dev-demo-1",
      values: {
        DI_1: 1,
        AI_1: 24.2,
        MI_1: [{ slave_id: 1, registers: [{ readId: "read-1", value: [232] }] }]
      }
    });

    expect(parsed.values.AI_1).toBe(24.2);
  });

  it("requires stable uppercase port type code names", () => {
    expect(() =>
      portTypeSchema.parse({
        name: "Modbus Input",
        codeName: "mi",
        category: "INPUT",
        valueFormat: "MODBUS"
      })
    ).toThrow();
  });
});
