import {
  Globe,
  Images,
  Wand2,
  BookOpen,
  Zap,
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    title: "本地上传优化",
    description: "支持本地图片批量上传或粘贴，一键智能优化",
    icon: Images,
    link: "/scrape",
  },
  {
    title: "多语言翻译",
    description: "一键智能翻译标注，支持10+种语言",
    icon: Globe,
  },
  {
    title: "AI图片优化",
    description: "生成高清图、优化压缩、去噪处理",
    icon: Wand2,
  },
  {
    title: "知识库",
    description: "流程映射控制，知识库API对接",
    icon: BookOpen,
    link: "/knowledge",
  },
  {
    title: "高效工作流",
    description: "批量任务调度，智能策略推送",
    icon: Zap,
  },
];

export function FeatureGrid() {
  return (
    <section className="py-12 bg-gray-50 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            核心功能
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              link={feature.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
