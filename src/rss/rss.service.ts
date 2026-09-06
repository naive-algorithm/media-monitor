import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import {NewsItem } from './news-item.interface';

@Injectable()
export class RssService {
  async collect(url: string): Promise<NewsItem[]>{
    const res = await fetch(url);
    if(!res.ok) {
      throw new Error(`HTTP ${res.status} : ${res.statusText}`);
    }

    const parser = new XMLParser();
    const rss = parser.parse(await res.text()).rss;

    const items = rss.channel.item;

    return items.map((item: any) => ({
      title: item.title,
      description: item.description,
      url: item.link,
      publishedAt: new Date(item.pubDate),
      externalId: item.guid
    }));
  }
}