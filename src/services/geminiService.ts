import { PRODUCT_CATEGORIES } from '../config/categoryConfig';

export interface PromptParams {
  productName: string;
  categoryId: string;
  platform?: string;
  country?: string;
  additionalInfo?: string;
}

/**
 * Generates a comprehensive prompt for the AI model based on product and category details.
 */
export const generatePrompt = (params: PromptParams): string => {
  const { productName, categoryId, platform, country, additionalInfo } = params;

  // Find category details
  const category = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
  const categoryLabel = category ? category.label : '';

  // Construct the prompt
  let prompt = `Role: Expert E-commerce Copywriter & Visual Director\n`;
  prompt += `Task: Optimize product listing and generate visual concepts.\n\n`;
  
  prompt += `Product Information:\n`;
  prompt += `- Product Name: ${productName}\n`;
  if (categoryLabel) prompt += `- Category: ${categoryLabel}\n`;
  if (platform) prompt += `- Target Platform: ${platform}\n`;
  if (country) prompt += `- Target Market: ${country}\n`;
  if (additionalInfo) prompt += `- Additional Details: ${additionalInfo}\n`;
  
  prompt += `\nOutput Requirements:\n`;
  prompt += `1. Title: Create a high-converting, SEO-friendly title.\n`;
  prompt += `2. Bullets: Write 5 benefit-driven bullet points.\n`;
  prompt += `3. Description: Write a persuasive product description.\n`;
  
  return prompt;
};
