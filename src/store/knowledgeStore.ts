import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}

interface KnowledgeStore {
  articles: Article[];
  addArticle: (article: Omit<Article, 'id' | 'createdAt'>) => void;
  deleteArticle: (id: string) => void;
}

export const useKnowledgeStore = create<KnowledgeStore>()(
  persist(
    (set) => ({
      articles: [
        {
          id: '1',
          title: '如何开始使用商品抓取',
          category: '入门指南',
          content: '本指南将帮助您快速上手商品抓取功能...',
          createdAt: '2024-03-20',
        },
        {
          id: '2',
          title: 'API对接文档 v1.0',
          category: '开发者文档',
          content: '本文档详细说明了如何使用我们的API进行数据对接...',
          createdAt: '2024-03-21',
        },
      ],
      addArticle: (article) =>
        set((state) => ({
          articles: [
            {
              ...article,
              id: Math.random().toString(36).substr(2, 9),
              createdAt: new Date().toISOString().split('T')[0],
            },
            ...state.articles,
          ],
        })),
      deleteArticle: (id) =>
        set((state) => ({
          articles: state.articles.filter((a) => a.id !== id),
        })),
    }),
    {
      name: 'knowledge-storage',
    }
  )
);
