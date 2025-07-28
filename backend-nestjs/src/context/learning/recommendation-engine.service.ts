import { Injectable, Logger } from '@nestjs/common';
import { PatternAnalyzerService, UserBehaviorProfile } from './pattern-analyzer.service';
import { SlideType } from '../../entities/slide.entity';
import { PromptContext } from '../../ai/prompts/prompt-templates';

export interface ContentRecommendation {
  type: 'content' | 'structure' | 'style' | 'data';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  reasoning: string;
  confidence: number;
  actionable: boolean;
}

export interface ContextualPromptEnhancement {
  enhancedPrompt: string;
  personalizations: string[];
  confidenceScore: number;
  adaptations: {
    tone: string;
    structure: string;
    detail_level: string;
    data_emphasis: string;
  };
}

@Injectable()
export class RecommendationEngineService {
  private readonly logger = new Logger(RecommendationEngineService.name);

  constructor(
    private patternAnalyzer: PatternAnalyzerService,
  ) {}

  async generateContextualRecommendations(
    userId: string,
    slideType: SlideType,
    currentContent: string,
    deckContext: any,
    scopeType: 'deck' | 'project' | 'global' = 'deck',
    scopeId?: string
  ): Promise<ContentRecommendation[]> {
    this.logger.log(`Generating recommendations for ${slideType} slide`);

    // Get user behavior profile
    const behaviorProfile = await this.patternAnalyzer.analyzeUserBehavior(userId, scopeType, scopeId);
    
    // Get contextual recommendations from pattern analyzer
    const patternRecommendations = await this.patternAnalyzer.getContextualRecommendations(
      userId,
      slideType,
      currentContent,
      scopeType,
      scopeId
    );

    // Generate comprehensive recommendations
    const recommendations: ContentRecommendation[] = [];

    // Content-based recommendations
    recommendations.push(...this.generateContentRecommendations(behaviorProfile, currentContent, slideType));
    
    // Structure-based recommendations
    recommendations.push(...this.generateStructureRecommendations(behaviorProfile, currentContent, slideType));
    
    // Style-based recommendations
    recommendations.push(...this.generateStyleRecommendations(behaviorProfile, slideType, deckContext));
    
    // Data-based recommendations
    recommendations.push(...this.generateDataRecommendations(behaviorProfile, currentContent, slideType));

    // Sort by priority and confidence
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] - priorityOrder[a.priority]) || (b.confidence - a.confidence);
      })
      .slice(0, 8); // Return top 8 recommendations
  }

  async enhancePromptWithContext(
    userId: string,
    basePrompt: PromptContext,
    scopeType: 'deck' | 'project' | 'global' = 'deck',
    scopeId?: string
  ): Promise<ContextualPromptEnhancement> {
    this.logger.log(`Enhancing prompt with user context for ${basePrompt.slideType}`);

    // Get user behavior profile
    const behaviorProfile = await this.patternAnalyzer.analyzeUserBehavior(userId, scopeType, scopeId);
    
    // Build enhanced prompt
    const enhancement = this.buildEnhancedPrompt(basePrompt, behaviorProfile);
    
    return enhancement;
  }

  async trackUserSatisfaction(
    userId: string,
    recommendationId: string,
    action: 'accepted' | 'rejected' | 'modified',
    feedback?: string
  ): Promise<void> {
    // This would track user satisfaction with recommendations
    // and feed back into the learning system
    this.logger.log(`User ${action} recommendation ${recommendationId}`);
    
    // TODO: Implement satisfaction tracking and feedback loop
  }

  private generateContentRecommendations(
    profile: UserBehaviorProfile,
    content: string,
    slideType: SlideType
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    const wordCount = content.split(' ').length;

    // Length recommendations
    if (profile.contentPreferences.preferredLength === 'concise' && wordCount > 150) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        suggestion: 'Consider condensing this content to match your preference for concise slides',
        reasoning: 'Your editing history shows a preference for shorter, more focused content',
        confidence: 0.8,
        actionable: true,
      });
    } else if (profile.contentPreferences.preferredLength === 'detailed' && wordCount < 80) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        suggestion: 'You might want to add more detail to this slide based on your typical style',
        reasoning: 'Your previous slides tend to be more comprehensive',
        confidence: 0.7,
        actionable: true,
      });
    }

    // Data usage recommendations
    if (profile.contentPreferences.dataUsage === 'heavy' && !this.hasDataPoints(content)) {
      recommendations.push({
        type: 'data',
        priority: 'high',
        suggestion: 'Consider adding specific metrics, percentages, or data points',
        reasoning: 'You typically include substantial data to support your points',
        confidence: 0.85,
        actionable: true,
      });
    }

    return recommendations;
  }

  private generateStructureRecommendations(
    profile: UserBehaviorProfile,
    content: string,
    slideType: SlideType
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Structure preference recommendations
    if (profile.contentPreferences.structurePreference === 'bullet_points' && !this.hasBulletPoints(content)) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        suggestion: 'Consider formatting this content as bullet points for better readability',
        reasoning: 'You consistently prefer bullet point formatting in your slides',
        confidence: 0.75,
        actionable: true,
      });
    }

    // Slide-specific structure recommendations
    if (slideType === 'problem' && !this.hasStructuredProblemFormat(content)) {
      recommendations.push({
        type: 'structure',
        priority: 'high',
        suggestion: 'Structure this as: Current situation → Pain points → Impact/Cost',
        reasoning: 'Problem slides are most effective with clear problem-impact structure',
        confidence: 0.9,
        actionable: true,
      });
    }

    return recommendations;
  }

  private generateStyleRecommendations(
    profile: UserBehaviorProfile,
    slideType: SlideType,
    deckContext: any
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Tone recommendations
    if (profile.stylePreferences.tonePreference === 'professional' && slideType === 'funding_ask') {
      recommendations.push({
        type: 'style',
        priority: 'high',
        suggestion: 'Maintain formal, professional language for investor credibility',
        reasoning: 'Your style preference aligns with investor expectations',
        confidence: 0.9,
        actionable: true,
      });
    }

    // Industry-specific recommendations
    if (profile.stylePreferences.industryFocus.includes(deckContext.industry)) {
      recommendations.push({
        type: 'style',
        priority: 'medium',
        suggestion: `Leverage your ${deckContext.industry} expertise with industry-specific terminology`,
        reasoning: `You have demonstrated expertise in ${deckContext.industry}`,
        confidence: 0.8,
        actionable: true,
      });
    }

    return recommendations;
  }

  private generateDataRecommendations(
    profile: UserBehaviorProfile,
    content: string,
    slideType: SlideType
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Slide-specific data recommendations
    const dataRequirements = this.getSlideDataRequirements(slideType);
    
    dataRequirements.forEach(requirement => {
      if (!this.hasDataType(content, requirement.type)) {
        recommendations.push({
          type: 'data',
          priority: requirement.priority,
          suggestion: requirement.suggestion,
          reasoning: requirement.reasoning,
          confidence: 0.85,
          actionable: true,
        });
      }
    });

    return recommendations;
  }

  private buildEnhancedPrompt(
    basePrompt: PromptContext,
    profile: UserBehaviorProfile
  ): ContextualPromptEnhancement {
    const personalizations: string[] = [];
    let enhancedPrompt = '';

    // Add style preferences
    if (profile.stylePreferences.tonePreference) {
      personalizations.push(`Tone: ${profile.stylePreferences.tonePreference}`);
      enhancedPrompt += `\nUse a ${profile.stylePreferences.tonePreference} tone throughout.`;
    }

    // Add structure preferences
    if (profile.contentPreferences.structurePreference === 'bullet_points') {
      personalizations.push('Structure: Bullet points preferred');
      enhancedPrompt += '\nFormat content using clear bullet points for readability.';
    }

    // Add length preferences
    if (profile.contentPreferences.preferredLength === 'concise') {
      personalizations.push('Length: Concise content preferred');
      enhancedPrompt += '\nKeep content concise and focused on key points.';
    } else if (profile.contentPreferences.preferredLength === 'detailed') {
      personalizations.push('Length: Detailed content preferred');
      enhancedPrompt += '\nProvide comprehensive details and thorough explanations.';
    }

    // Add data preferences
    if (profile.contentPreferences.dataUsage === 'heavy') {
      personalizations.push('Data: Heavy use of metrics and statistics');
      enhancedPrompt += '\nInclude specific data points, metrics, and quantifiable information.';
    }

    const adaptations = {
      tone: profile.stylePreferences.tonePreference || 'professional',
      structure: profile.contentPreferences.structurePreference || 'mixed',
      detail_level: profile.contentPreferences.preferredLength || 'moderate',
      data_emphasis: profile.contentPreferences.dataUsage || 'moderate',
    };

    return {
      enhancedPrompt,
      personalizations,
      confidenceScore: this.calculatePersonalizationConfidence(profile),
      adaptations,
    };
  }

  // Helper methods
  private hasDataPoints(content: string): boolean {
    return /\d+%|\$[\d,]+|[\d,]+\s*(million|billion|thousand)|[\d.]+[xX]/.test(content);
  }

  private hasBulletPoints(content: string): boolean {
    return content.includes('•') || content.includes('- ') || /^\s*\d+\.\s/.test(content);
  }

  private hasStructuredProblemFormat(content: string): boolean {
    const problemKeywords = ['current', 'situation', 'pain', 'challenge', 'impact', 'cost'];
    const foundKeywords = problemKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );
    return foundKeywords.length >= 3;
  }

  private hasDataType(content: string, dataType: string): boolean {
    const patterns = {
      'percentage': /\d+%/,
      'currency': /\$[\d,]+/,
      'metrics': /\d+\s*(users|customers|revenue|growth)/i,
      'timeframe': /\d+\s*(months|years|days)/i,
      'scale': /\d+\s*(million|billion|thousand)/i,
    };

    return patterns[dataType]?.test(content) || false;
  }

  private getSlideDataRequirements(slideType: SlideType): Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    reasoning: string;
  }> {
    const requirements = {
      market: [
        {
          type: 'currency',
          priority: 'high' as const,
          suggestion: 'Include market size in dollars (TAM/SAM/SOM)',
          reasoning: 'Investors expect quantified market opportunities',
        },
        {
          type: 'percentage',
          priority: 'medium' as const,
          suggestion: 'Add market growth rate percentages',
          reasoning: 'Growth rates demonstrate market momentum',
        },
      ],
      traction: [
        {
          type: 'metrics',
          priority: 'high' as const,
          suggestion: 'Include specific user/customer metrics',
          reasoning: 'Traction slides require concrete proof points',
        },
        {
          type: 'percentage',
          priority: 'high' as const,
          suggestion: 'Show growth percentages over time',
          reasoning: 'Growth rates demonstrate momentum',
        },
      ],
      financials: [
        {
          type: 'currency',
          priority: 'high' as const,
          suggestion: 'Include revenue projections and funding amounts',
          reasoning: 'Financial slides must have specific dollar amounts',
        },
        {
          type: 'timeframe',
          priority: 'medium' as const,
          suggestion: 'Specify timeframes for projections',
          reasoning: 'Investors need timeline context',
        },
      ],
    };

    return requirements[slideType] || [];
  }

  private calculatePersonalizationConfidence(profile: UserBehaviorProfile): number {
    let confidence = 0;
    let factors = 0;

    // Check if we have enough data for each preference type
    if (profile.contentPreferences.preferredLength && profile.contentPreferences.preferredLength !== 'detailed') {
      confidence += 0.25;
      factors++;
    }

    if (profile.contentPreferences.structurePreference !== 'mixed') {
      confidence += 0.25;
      factors++;
    }

    if (profile.stylePreferences.tonePreference !== 'professional') {
      confidence += 0.25;
      factors++;
    }

    if (profile.contentPreferences.dataUsage !== 'moderate') {
      confidence += 0.25;
      factors++;
    }

    return factors > 0 ? confidence : 0.1; // Minimum confidence
  }
}
