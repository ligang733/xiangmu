export interface GenerateRequest {
  productName: string;
  category: string;
  platform: string;
  country: string;
  images: string[];
  imageCount: number; // 允许值为 1, 2, 3, 4, 5, 6, 7, 8
  visual_features?: string[]; // New field for visual tags
}
