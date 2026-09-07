import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsOptional,
} from "class-validator";
import { Transform } from "class-transformer";

export class RssItemDto {
  @Transform(
    ({ value }) => (typeof value === "string" ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUrl()
  link!: string;

  @IsNotEmpty()
  @IsString()
  pubDate!: string;

  @IsNotEmpty()
  @IsString()
  guid!: string;
}
