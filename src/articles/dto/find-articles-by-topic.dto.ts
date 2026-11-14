import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from "class-validator";

export class FindArticlesByTopicDto {
  @Transform(
    ({ value }) => (typeof value === "string" ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  topicCode!: string;

  @Transform(
    ({ value }) => (typeof value === "string" ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  classifierVersion!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
