import { IsEnum, IsNotEmpty, IsString, Length, IsUrl } from "class-validator";
import { CollectorType } from "../collector-type.enum";

export class CreateSourceDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    name!: string;

    @IsUrl()
    @IsNotEmpty()
    url!: string;

    @IsEnum(CollectorType)
    collectorType!: CollectorType;
}