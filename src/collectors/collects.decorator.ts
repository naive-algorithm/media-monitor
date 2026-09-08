import { SetMetadata } from '@nestjs/common';
import { CollectorType } from './collector-type.enum';

export const COLLECTOR_TYPE_METADATA_KEY = Symbol('collector:type');

export const Collects = (type: CollectorType): ClassDecorator =>
  SetMetadata(COLLECTOR_TYPE_METADATA_KEY, type);
