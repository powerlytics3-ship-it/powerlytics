import { Injectable } from "@nestjs/common";
import { isProductionDataMode } from "../config/env.js";
import { DemoStateService } from "../demo/demo-state.service.js";
import { ProductionStateService } from "../production/production-state.service.js";

@Injectable()
export class AppStateService extends DemoStateService {
  constructor(private readonly production: ProductionStateService) {
    super();

    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (property === "production" || property === "constructor") {
          return Reflect.get(target, property, receiver);
        }
        const productionValue = Reflect.get(this.production, property, this.production);
        if (isProductionDataMode() && typeof productionValue === "function") {
          return productionValue.bind(this.production);
        }
        return Reflect.get(target, property, receiver);
      }
    });
  }
}
