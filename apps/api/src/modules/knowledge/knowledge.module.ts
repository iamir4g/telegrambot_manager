import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { TopicsService } from './topics.service';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { FaqsController } from './faqs.controller';
import { TopicsController } from './topics.controller';

@Module({
  controllers: [FaqsController, TopicsController],
  providers: [FaqsService, TopicsService, KnowledgeRetrievalService],
  exports: [FaqsService, TopicsService, KnowledgeRetrievalService],
})
export class KnowledgeModule {}
