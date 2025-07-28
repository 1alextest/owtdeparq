import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlideType } from '../../entities/slide.entity';
import axios from 'axios';

export interface ImageSuggestion {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  source: 'unsplash' | 'pexels' | 'pixabay' | 'generated';
  license: string;
  attribution?: string;
  width: number;
  height: number;stag
  relevanceScore: number;
}

export interface ImageSearchOptions {
  query?: string;
  slideType?: SlideType;
  slideContent?: string;
  industry?: string;
  style?: 'professional' | 'modern' | 'creative' | 'minimal';
  orientation?: 'landscape' | 'portrait' | 'square';
  color?: string;
  limit?: number;
}

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  tags: Array<{ title: string }>;
  user: {
    name: string;
    username: string;
  };
  width: number;
  height: number;
}

@Injectable()
export class ImageSuggestionService {
  private readonly logger = new Logger(ImageSuggestionService.name);
  private readonly unsplashApiKey: string;
  private readonly pexelsApiKey: string;

  constructor(private configService: ConfigService) {
    this.unsplashApiKey = this.configService.get<string>('UNSPLASH_API_KEY');
    this.pexelsApiKey = this.configService.get<string>('PEXELS_API_KEY');
  }

  async suggestImages(options: ImageSearchOptions): Promise<ImageSuggestion[]> {
    this.logger.log(`Generating image suggestions for: ${options.query || options.slideType}`);

    // Generate smart search query
    const searchQuery = this.generateSearchQuery(options);
    
    // Get suggestions from multiple sources
    const suggestions: ImageSuggestion[] = [];

    try {
      // Unsplash suggestions
      if (this.unsplashApiKey) {
        const unsplashImages = await this.searchUnsplash(searchQuery, options);
        suggestions.push(...unsplashImages);
      }

      // Pexels suggestions
      if (this.pexelsApiKey) {
        const pexelsImages = await this.searchPexels(searchQuery, options);
        suggestions.push(...pexelsImages);
      }

      // Fallback to curated suggestions if no API keys
      if (suggestions.length === 0) {
        suggestions.push(...this.getCuratedSuggestions(options));
      }

      // Sort by relevance and apply limit
      const sortedSuggestions = suggestions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, options.limit || 12);

      this.logger.log(`Generated ${sortedSuggestions.length} image suggestions`);
      return sortedSuggestions;
    } catch (error) {
      this.logger.error('Failed to generate image suggestions:', error);
      return this.getCuratedSuggestions(options);
    }
  }

  async searchBySlideContent(
    slideType: SlideType,
    slideTitle: string,
    slideContent: string,
    industry?: string
  ): Promise<ImageSuggestion[]> {
    // Analyze slide content to generate relevant search terms
    const keywords = this.extractKeywords(slideContent, slideTitle);
    const slideSpecificTerms = this.getSlideTypeKeywords(slideType);
    const industryTerms = industry ? this.getIndustryKeywords(industry) : [];

    const searchQuery = [...keywords, ...slideSpecificTerms, ...industryTerms]
      .slice(0, 5)
      .join(' ');

    return this.suggestImages({
      query: searchQuery,
      slideType,
      slideContent,
      industry,
      style: 'professional',
      limit: 8,
    });
  }

  private generateSearchQuery(options: ImageSearchOptions): string {
    const terms: string[] = [];

    // Add explicit query
    if (options.query) {
      terms.push(options.query);
    }

    // Add slide type specific terms
    if (options.slideType) {
      terms.push(...this.getSlideTypeKeywords(options.slideType));
    }

    // Add industry terms
    if (options.industry) {
      terms.push(...this.getIndustryKeywords(options.industry));
    }

    // Add style terms
    if (options.style) {
      terms.push(...this.getStyleKeywords(options.style));
    }

    // Extract keywords from content
    if (options.slideContent) {
      const contentKeywords = this.extractKeywords(options.slideContent);
      terms.push(...contentKeywords.slice(0, 3));
    }

    return terms.slice(0, 6).join(' ');
  }

  private async searchUnsplash(query: string, options: ImageSearchOptions): Promise<ImageSuggestion[]> {
    try {
      const params = {
        query,
        per_page: Math.min(options.limit || 6, 30),
        orientation: options.orientation || 'landscape',
        color: options.color,
      };

      const response = await axios.get('https://api.unsplash.com/search/photos', {
        headers: {
          'Authorization': `Client-ID ${this.unsplashApiKey}`,
        },
        params,
      });

      return response.data.results.map((image: UnsplashImage, index: number) => ({
        id: `unsplash_${image.id}`,
        url: image.urls.regular,
        thumbnailUrl: image.urls.thumb,
        title: image.alt_description || image.description || 'Professional Image',
        description: image.description || image.alt_description || '',
        tags: image.tags?.map(tag => tag.title) || [],
        source: 'unsplash' as const,
        license: 'Unsplash License',
        attribution: `Photo by ${image.user.name} on Unsplash`,
        width: image.width,
        height: image.height,
        relevanceScore: this.calculateRelevanceScore(image, query, options, index),
      }));
    } catch (error) {
      this.logger.warn('Unsplash search failed:', error.message);
      return [];
    }
  }

  private async searchPexels(query: string, options: ImageSearchOptions): Promise<ImageSuggestion[]> {
    try {
      const params = {
        query,
        per_page: Math.min(options.limit || 6, 80),
        orientation: options.orientation || 'landscape',
        color: options.color,
      };

      const response = await axios.get('https://api.pexels.com/v1/search', {
        headers: {
          'Authorization': this.pexelsApiKey,
        },
        params,
      });

      return response.data.photos.map((photo: any, index: number) => ({
        id: `pexels_${photo.id}`,
        url: photo.src.large,
        thumbnailUrl: photo.src.medium,
        title: photo.alt || 'Professional Image',
        description: photo.alt || '',
        tags: [],
        source: 'pexels' as const,
        license: 'Pexels License',
        attribution: `Photo by ${photo.photographer} on Pexels`,
        width: photo.width,
        height: photo.height,
        relevanceScore: this.calculateRelevanceScore(photo, query, options, index),
      }));
    } catch (error) {
      this.logger.warn('Pexels search failed:', error.message);
      return [];
    }
  }

  private getCuratedSuggestions(options: ImageSearchOptions): ImageSuggestion[] {
    // Fallback curated suggestions when APIs are not available
    const curatedImages = this.getCuratedImagesBySlideType(options.slideType);
    
    return curatedImages.map((image, index) => ({
      ...image,
      relevanceScore: 0.5 - (index * 0.05), // Decreasing relevance
    }));
  }

  private getCuratedImagesBySlideType(slideType?: SlideType): Omit<ImageSuggestion, 'relevanceScore'>[] {
    const baseImages = {
      problem: [
        {
          id: 'curated_problem_1',
          url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
          thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300',
          title: 'Business Challenge',
          description: 'Professional business meeting discussing challenges',
          tags: ['business', 'meeting', 'challenge'],
          source: 'unsplash' as const,
          license: 'Unsplash License',
          width: 1200,
          height: 800,
        },
      ],
      solution: [
        {
          id: 'curated_solution_1',
          url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984',
          thumbnailUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=300',
          title: 'Innovation Solution',
          description: 'Light bulb representing innovative solutions',
          tags: ['innovation', 'solution', 'idea'],
          source: 'unsplash' as const,
          license: 'Unsplash License',
          width: 1200,
          height: 800,
        },
      ],
      market: [
        {
          id: 'curated_market_1',
          url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
          thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300',
          title: 'Market Analysis',
          description: 'Financial charts and market data',
          tags: ['market', 'analysis', 'data'],
          source: 'unsplash' as const,
          license: 'Unsplash License',
          width: 1200,
          height: 800,
        },
      ],
      team: [
        {
          id: 'curated_team_1',
          url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
          thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300',
          title: 'Professional Team',
          description: 'Diverse professional team collaboration',
          tags: ['team', 'collaboration', 'professional'],
          source: 'unsplash' as const,
          license: 'Unsplash License',
          width: 1200,
          height: 800,
        },
      ],
    };

    return baseImages[slideType] || baseImages.solution;
  }

  private getSlideTypeKeywords(slideType: SlideType): string[] {
    const keywords = {
      cover: ['business', 'professional', 'corporate', 'presentation'],
      problem: ['challenge', 'issue', 'problem', 'difficulty', 'obstacle'],
      solution: ['solution', 'innovation', 'idea', 'lightbulb', 'breakthrough'],
      market: ['market', 'analysis', 'data', 'chart', 'growth', 'statistics'],
      product: ['product', 'technology', 'device', 'software', 'innovation'],
      business_model: ['business', 'model', 'strategy', 'plan', 'framework'],
      go_to_market: ['marketing', 'strategy', 'launch', 'promotion', 'outreach'],
      competition: ['competition', 'analysis', 'comparison', 'market'],
      team: ['team', 'people', 'collaboration', 'professional', 'group'],
      financials: ['finance', 'money', 'revenue', 'growth', 'investment'],
      traction: ['growth', 'progress', 'success', 'achievement', 'milestone'],
      funding_ask: ['investment', 'funding', 'money', 'finance', 'capital'],
    };

    return keywords[slideType] || ['business', 'professional'];
  }

  private getIndustryKeywords(industry: string): string[] {
    const industryMap = {
      'technology': ['tech', 'software', 'digital', 'computer', 'innovation'],
      'healthcare': ['medical', 'health', 'hospital', 'doctor', 'care'],
      'finance': ['financial', 'banking', 'money', 'investment', 'trading'],
      'education': ['education', 'learning', 'school', 'student', 'teaching'],
      'retail': ['shopping', 'store', 'customer', 'commerce', 'sales'],
      'manufacturing': ['factory', 'production', 'industrial', 'machinery'],
      'real estate': ['property', 'building', 'construction', 'architecture'],
      'food': ['food', 'restaurant', 'cooking', 'kitchen', 'dining'],
      'travel': ['travel', 'tourism', 'vacation', 'destination', 'journey'],
      'fitness': ['fitness', 'gym', 'exercise', 'health', 'workout'],
    };

    const normalizedIndustry = industry.toLowerCase();
    return industryMap[normalizedIndustry] || ['business', 'professional'];
  }

  private getStyleKeywords(style: string): string[] {
    const styleMap = {
      'professional': ['professional', 'business', 'corporate', 'formal'],
      'modern': ['modern', 'contemporary', 'sleek', 'minimalist'],
      'creative': ['creative', 'artistic', 'colorful', 'vibrant'],
      'minimal': ['minimal', 'simple', 'clean', 'white'],
    };

    return styleMap[style] || ['professional'];
  }

  private extractKeywords(content: string, title?: string): string[] {
    const text = `${title || ''} ${content}`.toLowerCase();

    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 10);

    return [...new Set(words)]; // Remove duplicates
  }

  private calculateRelevanceScore(
    image: any,
    query: string,
    options: ImageSearchOptions,
    index: number
  ): number {
    let score = 1.0 - (index * 0.05); // Base score decreases with position

    // Boost score based on title/description relevance
    const queryTerms = query.toLowerCase().split(' ');
    const imageText = `${image.alt_description || image.alt || ''} ${image.description || ''}`.toLowerCase();

    const matchingTerms = queryTerms.filter(term => imageText.includes(term));
    score += matchingTerms.length * 0.1;

    // Boost for professional orientation
    if (options.orientation === 'landscape' && image.width > image.height) {
      score += 0.1;
    }

    // Boost for high resolution
    if (image.width >= 1920 && image.height >= 1080) {
      score += 0.05;
    }

    return Math.min(1.0, score);
  }

  async getImageMetadata(imageUrl: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  } | null> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const buffer = Buffer.from(response.data);
      const imageSize = await import('image-size');
      const dimensions = imageSize.default(buffer);

      return {
        width: dimensions.width || 0,
        height: dimensions.height || 0,
        format: dimensions.type || 'unknown',
        size: buffer.length,
      };
    } catch (error) {
      this.logger.warn(`Failed to get image metadata for ${imageUrl}:`, error.message);
      return null;
    }
  }
}
