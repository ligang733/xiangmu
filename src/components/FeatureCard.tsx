import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link?: string;
}

export function FeatureCard({ title, description, icon: Icon, link }: FeatureCardProps) {
  const CardContent = (
    <div className={`flex flex-col h-full overflow-hidden transition-shadow duration-300 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md ${link ? 'cursor-pointer' : ''}`}>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-100 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="ml-3 text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="h-1 mt-auto bg-gradient-to-r from-blue-50 to-blue-100" />
    </div>
  );

  if (link) {
    return <Link to={link} className="block h-full">{CardContent}</Link>;
  }

  return CardContent;
}
