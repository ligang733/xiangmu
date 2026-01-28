import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { Plus, Search, FileText, ArrowLeft } from 'lucide-react';

export const KnowledgeBase = () => {
  const navigate = useNavigate();
  const { articles, deleteArticle } = useKnowledgeStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">知识库</h1>
              <p className="text-gray-500 mt-1">管理和浏览所有文档与教程</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/knowledge/upload')}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>上传文章</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索文章标题或分类..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {article.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                {article.content}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-4">
                <span>发布于 {article.createdAt}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这篇文章吗？')) {
                      deleteArticle(article.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">未找到相关文章</h3>
            <p className="text-gray-500 mt-2">试试其他关键词，或者上传新文章</p>
          </div>
        )}
      </div>
    </div>
  );
};
