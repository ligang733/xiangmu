import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { ArrowLeft, Upload } from 'lucide-react';

export const UploadArticle = () => {
  const navigate = useNavigate();
  const { addArticle } = useKnowledgeStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    title: '',
    category: '未分类',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addArticle(formData);
    navigate('/knowledge');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/knowledge')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回知识库
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-900">上传新文章</h1>
            <p className="text-gray-500 mt-1">创建新的知识库文档或教程</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章标题
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入文章标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="入门指南">入门指南</option>
                <option value="功能介绍">功能介绍</option>
                <option value="常见问题">常见问题</option>
                <option value="开发者文档">开发者文档</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                required
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="在此输入文章内容（支持Markdown格式）..."
              />
            </div>

            {/* File Upload Area (Visual only for now) */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">点击上传文件或拖拽文件到此处</p>
              <p className="text-xs text-gray-400 mt-1">支持 .md, .txt, .pdf 格式</p>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/knowledge')}
                className="px-6 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? '正在发布...' : '发布文章'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
