import { NextRequest, NextResponse } from 'next/server';

const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai', 'anthropic', 'gemini', 'groq'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, projectId, videoDuration, conversationHistory } = await request.json();

    if (!AI_API_KEY) {
      return NextResponse.json(
        { 
          response: "AI is not configured. Please add your AI API key to the environment variables.",
          command: null
        },
        { status: 200 }
      );
    }

    const systemPrompt = `You are an AI video editing assistant. You help users edit their videos through natural language commands.

Available commands you can execute:
1. **change_aspect_ratio**: Change video aspect ratio (16:9, 9:16, 1:1, 4:5)
2. **add_text_overlay**: Add text overlay to video with position, color, font, timing
3. **trim_video**: Trim or cut video at specific timestamps
4. **add_filter**: Apply visual filters (brightness, contrast, saturation, blur)
5. **add_music**: Add background music or replace audio
6. **generate_captions**: Generate AI captions from speech
7. **export_video**: Export the edited video

When a user asks to do something, parse their intent and respond with:
1. A friendly confirmation message
2. Extract parameters needed for the command

Current video context:
- Project ID: ${projectId}
- Video Duration: ${Math.floor(videoDuration)}seconds (${Math.floor(videoDuration / 60)}m ${Math.floor(videoDuration % 60)}s)

Response format:
{
  "response": "Your friendly response to the user",
  "command": {
    "action": "command_name",
    "params": { /* extracted parameters */ }
  }
}

If you can't execute the command or need more info, set command to null and ask for clarification.

Examples:
User: "Make this vertical for TikTok"
Response: {
  "response": "I'll convert your video to 9:16 vertical format, perfect for TikTok! 📱",
  "command": { "action": "change_aspect_ratio", "params": { "ratio": "9:16" } }
}

User: "Add 'Subscribe Now' text at the bottom at 5 seconds"
Response: {
  "response": "Adding 'Subscribe Now' text at the bottom starting at 5 seconds! ✨",
  "command": { 
    "action": "add_text_overlay", 
    "params": { 
      "text": "Subscribe Now", 
      "position": "bottom", 
      "startTime": 5,
      "duration": 3
    } 
  }
}`;

    let aiResponse = '';
    
    if (AI_PROVIDER === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-5).map((msg: Message) => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      aiResponse = data.choices[0]?.message?.content || '';
    } else if (AI_PROVIDER === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...conversationHistory.slice(-5).map((msg: Message) => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content
            })),
            { role: 'user', content: message }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      aiResponse = data.content[0]?.text || '';
    } else if (AI_PROVIDER === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUser: ${message}`
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      aiResponse = data.candidates[0]?.content?.parts[0]?.text || '';
    }

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch (e) {
    }

    return NextResponse.json({
      response: aiResponse || "I'm not sure how to help with that. Can you try rephrasing?",
      command: null
    });

  } catch (error: any) {
    console.error('AI Assistant error:', error);
    return NextResponse.json(
      { 
        response: "Sorry, I encountered an error. Please try again.",
        command: null,
        error: error.message
      },
      { status: 200 }
    );
  }
}
