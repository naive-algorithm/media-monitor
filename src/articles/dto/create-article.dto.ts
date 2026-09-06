import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  content: string;
}
