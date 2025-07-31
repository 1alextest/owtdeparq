import { SlideType } from '../../entities/slide.entity';

export interface PromptContext {
  slideType: SlideType;
  companyName?: string;
  industry?: string;
  targetMarket?: string;
  userPreferences?: any;
  previousContent?: string;
  userFeedback?: string;
}

export class PromptTemplates {
  static readonly SYSTEM_PROMPT = `You are an expert pitch deck consultant with 15+ years of experience helping startups raise funding from top-tier VCs. You create compelling, investor-ready content that follows proven frameworks and best practices.

Key principles:
- Focus on clear value propositions and market opportunities
- Use data-driven insights and specific metrics when possible
- Structure content for maximum investor appeal
- Keep language professional yet engaging
- Emphasize scalability and growth potential
- Address common investor concerns proactively`;

  static readonly SLIDE_TEMPLATES: Record<SlideType, string> = {
    cover: `Create a compelling cover slide for a pitch deck with the following requirements:
- Company name: {companyName}
- Industry: {industry}
- One powerful tagline that captures the value proposition
- Brief subtitle describing what the company does
- Keep it clean, professional, and memorable
- Focus on the transformation or outcome the company enables

Format as:
Title: [Company Name]
Tagline: [Compelling one-liner]
Subtitle: [Brief description]
Content: [2-3 sentences about the company's mission and impact]`,

    problem: `Create a compelling problem slide that establishes market need:
- Industry: {industry}
- Target market: {targetMarket}
- Identify a significant, widespread problem
- Use specific data points and statistics
- Make it relatable and urgent
- Show the cost of not solving this problem
- Avoid generic problems - be specific to your market

Structure:
Title: The Problem We're Solving
Content: [3-4 bullet points describing the problem with supporting data]
Impact: [Quantify the problem's scale and cost]`,

    solution: `Create a solution slide that clearly addresses the identified problem:
- Company: {companyName}
- Industry: {industry}
- Present a clear, innovative solution
- Explain how it's different from existing approaches
- Focus on unique value proposition
- Include key features or methodology
- Show why this solution works now

Structure:
Title: Our Solution
Content: [Clear description of the solution and its key differentiators]
Benefits: [3-4 key benefits that directly address the problem]`,

    market: `Create a market opportunity slide that excites investors:
- Industry: {industry}
- Target market: {targetMarket}
- Show total addressable market (TAM)
- Break down serviceable addressable market (SAM)
- Identify serviceable obtainable market (SOM)
- Include market growth trends
- Highlight market timing and catalysts

Structure:
Title: Market Opportunity
Content: [Market size data with TAM/SAM/SOM breakdown]
Growth: [Market growth trends and drivers]
Timing: [Why now is the right time]`,

    product: `Create a product overview slide that demonstrates capability:
- Company: {companyName}
- Industry: {industry}
- Showcase key product features
- Highlight unique technology or approach
- Include user experience benefits
- Show product development stage
- Mention any IP or competitive advantages

Structure:
Title: Product Overview
Content: [Core product features and capabilities]
Differentiation: [What makes the product unique]
Status: [Development stage and key milestones]`,

    business_model: `Create a business model slide that shows revenue potential:
- Company: {companyName}
- Industry: {industry}
- Explain revenue streams clearly
- Show pricing strategy
- Include unit economics if available
- Demonstrate scalability
- Compare to successful models in the space

Structure:
Title: Business Model
Content: [Revenue streams and pricing strategy]
Economics: [Unit economics and scalability factors]
Validation: [Early traction or comparable models]`,

    go_to_market: `Create a go-to-market strategy slide:
- Company: {companyName}
- Target market: {targetMarket}
- Industry: {industry}
- Define customer acquisition strategy
- Identify key distribution channels
- Show customer acquisition cost (CAC) strategy
- Include partnership opportunities
- Outline sales and marketing approach

Structure:
Title: Go-to-Market Strategy
Content: [Customer acquisition and distribution strategy]
Channels: [Key sales and marketing channels]
Partnerships: [Strategic partnership opportunities]`,

    competition: `Create a competitive analysis slide:
- Company: {companyName}
- Industry: {industry}
- Map competitive landscape
- Show competitive advantages
- Identify market positioning
- Highlight barriers to entry you're creating
- Avoid saying "no competition" - show awareness

Structure:
Title: Competitive Landscape
Content: [Key competitors and market positioning]
Advantages: [Your competitive differentiators]
Barriers: [Defensibility and moats you're building]`,

    team: `Create a team slide that builds investor confidence:
- Company: {companyName}
- Industry: {industry}
- Highlight relevant experience
- Show domain expertise
- Include previous successes
- Demonstrate complementary skills
- Mention key advisors or board members

Structure:
Title: Our Team
Content: [Key team members with relevant experience]
Expertise: [Domain knowledge and track record]
Advisors: [Notable advisors or board members]`,

    financials: `Create a financial projections slide:
- Company: {companyName}
- Industry: {industry}
- Show 3-5 year revenue projections
- Include key metrics and assumptions
- Demonstrate path to profitability
- Show funding requirements
- Include comparable company metrics

Structure:
Title: Financial Projections
Content: [Revenue projections and key metrics]
Assumptions: [Key drivers and assumptions]
Profitability: [Path to profitability and unit economics]`,

    traction: `Create a traction slide that proves momentum:
- Company: {companyName}
- Industry: {industry}
- Show key metrics and growth
- Include customer testimonials or case studies
- Highlight partnerships or pilot programs
- Demonstrate product-market fit signals
- Show progression over time

Structure:
Title: Traction & Milestones
Content: [Key metrics showing growth and validation]
Customers: [Customer success stories or testimonials]
Milestones: [Key achievements and upcoming goals]`,

    funding_ask: `Create a funding ask slide that's clear and compelling:
- Company: {companyName}
- Industry: {industry}
- State funding amount clearly
- Show use of funds breakdown
- Include timeline and milestones
- Demonstrate ROI potential for investors
- Mention exit strategy or growth path

Structure:
Title: Funding Ask
Content: [Funding amount and use of funds]
Milestones: [Key milestones to be achieved]
Returns: [Growth trajectory and investor returns]`
  };

  static buildPrompt(context: PromptContext): string {
    const template = this.SLIDE_TEMPLATES[context.slideType];
    if (!template) {
      throw new Error(`No template found for slide type: ${context.slideType}`);
    }

    let prompt = template;
    
    // Replace placeholders with actual values
    if (context.companyName) {
      prompt = prompt.replace(/{companyName}/g, context.companyName);
    }
    if (context.industry) {
      prompt = prompt.replace(/{industry}/g, context.industry);
    }
    if (context.targetMarket) {
      prompt = prompt.replace(/{targetMarket}/g, context.targetMarket);
    }

    // Add user preferences if available
    if (context.userPreferences) {
      prompt += `\n\nUser Preferences: ${JSON.stringify(context.userPreferences)}`;
    }

    // Add feedback for regeneration
    if (context.userFeedback) {
      prompt += `\n\nUser Feedback: ${context.userFeedback}`;
      prompt += `\nPlease improve the content based on this feedback.`;
    }

    return prompt;
  }

  static buildFreeFormPrompt(userPrompt: string, userPreferences?: any): string {
    let prompt = `${this.SYSTEM_PROMPT}

User Request: Create a complete pitch deck based on this description: "${userPrompt}"

Please generate content for a pitch deck with the following 5 key slides:
1. Cover slide with company name and tagline
2. Problem statement
3. Solution overview
4. Market opportunity
5. Funding ask

For each slide, provide:
- A clear, compelling title
- Well-structured content (3-5 bullet points or paragraphs)
- Specific, actionable information
- Professional tone suitable for investors

Format each slide as:
SLIDE [NUMBER]: [SLIDE TYPE]
Title: [Title]
Content: [Content]
---`;

    if (userPreferences) {
      prompt += `\n\nUser Preferences: ${JSON.stringify(userPreferences)}`;
    }

    return prompt;
  }

  static buildChatbotPrompt(userMessage: string, deckContext: any, slideContext?: any): string {
    // Debug logging to identify the null access issue
    console.log('🔍 buildChatbotPrompt called with:', {
      deckContext,
      slideContext,
      userMessage: userMessage?.substring(0, 50) + '...'
    });

    // Safe access to deckContext properties
    const deckTitle = deckContext?.title || 'Dashboard Conversation';
    const deckMode = deckContext?.mode || 'general guidance';
    const slideInfo = slideContext ? `- Current Slide: ${slideContext.title || 'Untitled'} (${slideContext.slideType || 'unknown'})` : '';

    return `${this.SYSTEM_PROMPT}

You are helping a user improve their pitch deck. Be specific, actionable, and focus on investor appeal.

Current Context:
- Deck: ${deckTitle}
- Mode: ${deckMode}
${slideInfo}

User Message: ${userMessage}

Provide specific, actionable advice that will make their pitch more compelling to investors. Focus on:
- Content clarity and impact
- Investor appeal and concerns
- Structure and flow
- Specific improvements rather than generic advice

Response:`;
  }
}
