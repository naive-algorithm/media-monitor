import { Injectable, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, Reflector } from "@nestjs/core";
import { CollectorType } from "./collector-type.enum";
import { Collector } from "./collector.abstract";
import { COLLECTOR_TYPE_METADATA_KEY } from "./collects.decorator";

function isCollectorType(value: unknown): value is CollectorType {
  return Object.values(CollectorType).some(
    (allowedType) => allowedType === value,
  );
}

@Injectable()
export class CollectorsRegistry implements OnModuleInit {
  private readonly collectors = new Map<CollectorType, Collector>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  registerCollector(type: CollectorType, collector: Collector): void {
    if (this.collectors.has(type)) {
      throw new Error(`Collector for type ${type} is already registered.`);
    }
    this.collectors.set(type, collector);
  }

  getCollector(type: CollectorType): Collector {
    const collector = this.collectors.get(type);
    if (!collector) {
      throw new Error(`Collector for type ${type} not found.`);
    }
    return collector;
  }

  onModuleInit() {
    const providers = this.discoveryService.getProviders();
    for (const provider of providers) {
      const providerClass = provider.metatype;
      if (!providerClass) {
        continue;
      }

      const collectorType = this.reflector.get<CollectorType | undefined>(
        COLLECTOR_TYPE_METADATA_KEY,
        providerClass,
      );

      if (collectorType === undefined) {
        continue;
      }

      if (!isCollectorType(collectorType)) {
        throw new Error(
          `Invalid collector type for provider ${providerClass.name}.`,
        );
      }

      const instance = provider.instance as unknown;
      if (!(instance instanceof Collector)) {
        throw new Error(
          `Provider ${providerClass.name} must extend Collector.`,
        );
      }

      this.registerCollector(collectorType, instance);
    }
  }
}
