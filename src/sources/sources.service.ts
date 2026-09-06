import { Injectable, NotFoundException } from "@nestjs/common";
import { Source } from "./source.entity";
import { SourcesRepository } from "./sources.repository";
import { CreateSourceDto } from "./dto/create-source.dto";
import { NewSource } from "./newSource.type";

@Injectable()
export class SourcesService {
  constructor(private readonly sourcesRepository: SourcesRepository) {}

  async findAll(): Promise<Source[]> {
    return await this.sourcesRepository.findAll();
  }

  async findEnabled(): Promise<Source[]> {
    return await this.sourcesRepository.findEnabled();
  }

  async updateLastCollectedAt(sourceId: number) {
    await this.sourcesRepository.updateLastCollectedAt(sourceId);
  }

  async findById(id: number): Promise<Source> {
    const source = await this.sourcesRepository.findById(id);
    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return source;
  }

  async enableSource(sourceId: number): Promise<Source> {
    const updated = await this.sourcesRepository.enableSource(sourceId);
    if (!updated) {
      throw new NotFoundException(`Source with ID ${sourceId} not found`);
    }
    return updated;
  }

  async disableSource(sourceId: number): Promise<Source> {
    const updated = await this.sourcesRepository.disableSource(sourceId);
    if (!updated) {
      throw new NotFoundException(`Source with ID ${sourceId} not found`);
    }

    return updated;
  }

  async create(dto: CreateSourceDto): Promise<Source> {
    const source: NewSource = {
      name: dto.name,
      url: dto.url,
      collectorType: dto.collectorType,
      isEnabled: true,
    };
    return await this.sourcesRepository.create(source);
  }
}
