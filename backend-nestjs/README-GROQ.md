# Using Groq with AI Pitch Deck Generator

This guide explains how to set up and use Groq with the AI Pitch Deck Generator application.

## What is Groq?

Groq is a cloud AI provider that offers ultra-fast inference for large language models. It's known for its Lightning Processing Unit (LPU) technology that delivers extremely low latency responses, making it ideal for real-time applications.

## Benefits of Using Groq

- **Speed**: Significantly faster inference than most other cloud providers
- **Quality**: Access to high-quality models like Llama 3 70B and Mixtral 8x7B
- **Simplicity**: Compatible with OpenAI API format
- **Cost-effective**: Competitive pricing compared to other cloud providers

## Available Models

The AI Pitch Deck Generator supports the following Groq models:

1. **Llama 3 (70B)** - `llama3-70b-8192`
   - High-quality model with 70 billion parameters
   - Excellent for complex content generation
   - Very fast inference with Groq's LPU technology

2. **Mixtral 8x7B** - `mixtral-8x7b-32768`
   - Mixture of experts model (8 experts, 7B parameters each)
   - Good balance of quality and speed
   - Handles diverse tasks well

3. **Gemma 7B** - `gemma-7b-it`
   - Google's lightweight instruction-tuned model
   - Good for simpler tasks
   - Very fast inference

## Setup

1. **Get a Groq API Key**:
   - Sign up at [console.groq.com](https://console.groq.com)
   - Create an API key in the console
   - Copy your API key

2. **Configure the Application**:
   - Add your Groq API key and base URL to the `.env` file:
   ```
   GROQ_API_KEY=your-groq-api-key-here
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   GROQ_ENABLED=true
   ```

## Using Groq in the Application

1. When generating a pitch deck, select one of the Groq models from the dropdown
2. The application will automatically use Groq's API for generation
3. You'll notice significantly faster generation times compared to other providers

## Troubleshooting

- **Authentication Error**: Make sure your API key is correct and properly formatted
- **Rate Limiting**: If you hit rate limits, consider upgrading your Groq account
- **Model Not Available**: Groq occasionally performs maintenance on models; try another model or provider

## Comparing Groq Models

| Model | Quality | Speed | Best For |
|-------|---------|-------|----------|
| Llama 3 (70B) | ★★★★★ | ★★★★★ | High-quality pitch decks with complex content |
| Mixtral 8x7B | ★★★★☆ | ★★★★★ | General-purpose pitch deck generation |
| Gemma 7B | ★★★☆☆ | ★★★★★ | Simple pitch decks with basic content |

## Additional Resources

- [Groq Documentation](https://console.groq.com/docs)
- [Groq API Reference](https://console.groq.com/docs/api-reference)
- [Groq Model Cards](https://console.groq.com/docs/models)