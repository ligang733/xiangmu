import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-white">
      <div className="relative pt-16 pb-16 ml-auto mr-auto sm:pb-24 lg:pb-32 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            智能商品信息优化工具
          </h1>
          <p className="max-w-md mx-auto mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            一站式解决方案：本地上传优化、多语言翻译、AI图片优化
          </p>
          <div className="max-w-md mx-auto mt-5 sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/scrape"
                className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-full hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                开始优化
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                to="#"
                className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                查看商品
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
