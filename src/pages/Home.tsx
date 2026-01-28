import { HeroSection } from "@/components/HeroSection";
import { FeatureGrid } from "@/components/FeatureGrid";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <HeroSection />
        <FeatureGrid />
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 智能商品信息抓取与优化工具. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
