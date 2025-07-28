# Using Ollama with AI Pitch Deck Generator

This guide explains how to set up and use Ollama with the AI Pitch Deck Generator application.

## What is Ollama?

Ollama is an open-source tool that allows you to run large language models (LLMs) locally on your machine. This means you can generate AI content without sending your data to external cloud services.

## Benefits of Using Ollama

- **Privacy**: Your data stays on your machine
- **No API costs**: Free to use without usage limits
- **Offline capability**: Works without internet connection once models are downloaded
- **Customization**: Multiple model options to fit your hardware capabilities

## Available Models

The AI Pitch Deck Generator supports the following Ollama models:

1. **Llama 3.1 (8B)** - `llama3.1:8b`
   - Lightweight model (8 billion parameters)
   - Good balance of quality and speed
   - Requires ~8GB RAM
   - Recommended for most users

2. **Llama 3.1 Instruct** - `llama3.1:instruct`
   - Instruction-tuned model for better responses
   - Requires ~10GB RAM
   - Better quality than the base 8B model

3. **Llama 3.1 (70B)** - `llama3.1:70b`
   - High-quality model (70 billion parameters)
   - Requires 40GB+ RAM and a powerful GPU
   - Best quality but slower and more resource-intensive

## Installation

1. **Install Ollama**:
   - Download from [ollama.ai](https://ollama.ai)
   - macOS: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Windows: Download the installer from the website

2. **Start Ollama**:
   ```
   ollama serve
   ```

3. **Pull the models**:
   ```
   # Basic model (recommended)
   ollama pull llama3.1:8b
   
   # Optional: Instruction-tuned model
   ollama pull llama3.1:instruct
   
   # Optional: Large model (requires powerful hardware)
   ollama pull llama3.1:70b
   ```

4. **Automated Setup**:
   We provide a setup script that helps you install and configure Ollama:
   ```
   cd backend-nestjs
   node scripts/setup-ollama.js
   ```

## Configuration

In your `.env` file, ensure you have the following settings:

```
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true
OLLAMA_DEFAULT_MODEL=llama3.1:8b
```

## Using Ollama in the Application

1. When generating a pitch deck, select your preferred model from the dropdown
2. The application will automatically use the selected model
3. If a model is not available, it will fall back to another available model

## Troubleshooting

- **Model not found**: Make sure you've pulled the model with `ollama pull <model-name>`
- **Service not running**: Start Ollama with `ollama serve`
- **Out of memory**: Try using a smaller model like `llama3.1:8b`
- **Slow generation**: Large models like `llama3.1:70b` are slower, especially without a GPU

## Hardware Requirements

- **Llama 3.1 (8B)**: 8GB+ RAM, any modern CPU
- **Llama 3.1 Instruct**: 10GB+ RAM, any modern CPU
- **Llama 3.1 (70B)**: 40GB+ RAM, powerful GPU recommended

For optimal performance with the 70B model, a GPU with at least 40GB VRAM is recommended.