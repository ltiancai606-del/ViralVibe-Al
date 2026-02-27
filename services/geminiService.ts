import { GoogleGenAI, Type } from "@google/genai";
import { TrendStyle, UploadedContent, WebSource, CatProfile } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the uploaded image/video to suggest viral trends.
 * Supports excluding existing trends to generate new ones (Load More).
 */
export const analyzeContentForTrends = async (
  content: UploadedContent, 
  existingTitles: string[] = []
): Promise<{ trends: TrendStyle[], sources: WebSource[] }> => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    // Construct context to exclude previous results
    const exclusionContext = existingTitles.length > 0 
      ? `\nIMPORTANT: You must recommend 3 NEW and DISTINCT styles that are completely different from these existing ones: ${existingTitles.join(', ')}.` 
      : '';

    const prompt = `
      你是一位精通小红书（XiaoHongShu）和抖音（Douyin）的资深社交媒体运营专家。
      
      任务 1：分析视觉内容
      请分析这张图片或视频帧的视觉元素、构图、色调和氛围。如果是猫咪，请特别注意它的毛色、神态。

      任务 2：搜索热门趋势 (Search)
      请利用 Google Search 搜索当前小红书和抖音上与该视觉内容相关的最新热门话题、挑战、BGM风格或滤镜趋势。
      
      任务 3：推荐爆款风格
      结合视觉分析和搜索到的热点，推荐 3 种适合该内容的独特“爆款风格”或内容方向。${exclusionContext}
      
      对于每种风格，请提供：
      1. 一个吸引人的中文标题（Title）。
      2. 一段简短的风格描述（Description），包含它为什么流行。
      3. 一个建议添加在画面上的简短中文花字/贴纸文案（Suggested Overlay Text），不超过 6 个字。
      4. 一个代表性的 Emoji。
      5. 一个符合该氛围的十六进制颜色代码（Hex Color）。
      
      请直接返回 JSON 格式数据。
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: content.mimeType,
              data: content.base64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              visualStyle: { type: Type.STRING },
              suggestedOverlayText: { type: Type.STRING },
              emoji: { type: Type.STRING },
              colorHex: { type: Type.STRING }
            },
            required: ["title", "description", "visualStyle", "suggestedOverlayText", "emoji", "colorHex"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Parse Trends
    const trendsRaw = JSON.parse(text) as TrendStyle[];
    const trends = trendsRaw.map((t, idx) => ({ ...t, id: t.id || `trend-${Date.now()}-${idx}` }));

    // Extract Search Sources
    const sources: WebSource[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    // Deduplicate sources by URI
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values()).slice(0, 5); // Limit to top 5

    return { trends, sources: uniqueSources };

  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback data in case of error
    return {
      trends: [
        {
          id: `fallback-${Date.now()}-1`,
          title: '日常氛围感',
          description: '干净、极简、柔和的光线，适合记录生活碎片。',
          visualStyle: '极简风',
          suggestedOverlayText: '今日份小确幸 ✨',
          emoji: '☁️',
          colorHex: '#bae6fd'
        },
        {
          id: `fallback-${Date.now()}-2`,
          title: '高燃卡点',
          description: '色彩大胆，节奏快，充满活力的视觉冲击。',
          visualStyle: '多巴胺',
          suggestedOverlayText: '快乐满分 🚀',
          emoji: '🔥',
          colorHex: '#fda4af'
        },
        {
          id: `fallback-${Date.now()}-3`,
          title: '电影感大片',
          description: '情绪饱满，深邃的色调，像电影画面一样有故事感。',
          visualStyle: '胶片感',
          suggestedOverlayText: '故事的开始',
          emoji: '🎞️',
          colorHex: '#a78bfa'
        }
      ],
      sources: []
    };
  }
};

/**
 * Generates the final caption and hashtags based on the selected style.
 * Accepts optional cat profiles to personalize the content.
 */
export const generateViralCaption = async (
  content: UploadedContent, 
  style: TrendStyle,
  cats?: CatProfile[]
): Promise<{ title: string; caption: string; hashtags: string[] }> => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    const parts: any[] = [
      {
        inlineData: {
          mimeType: content.mimeType,
          data: content.base64
        }
      }
    ];

    let catContext = "";
    if (cats && cats.length > 0) {
      const catsInfo = cats.map((c, index) => {
        // Add cat avatar to parts if available
        if (c.avatar) {
          // Extract base64 data (remove prefix if present)
          const base64Data = c.avatar.split(',')[1] || c.avatar;
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from string
              data: base64Data
            }
          });
          return `- 猫咪 ${index + 1} (参考图 ${index + 2}): 名字: ${c.name}, 品种: ${c.breed}, 性格: ${c.personality}, 爱好: ${c.hobbies}, 绝育状态: ${c.isNeutered ? '已绝育' : '未绝育'}`;
        }
        return `- 猫咪 ${index + 1} (无照片): 名字: ${c.name}, 品种: ${c.breed}, 性格: ${c.personality}, 爱好: ${c.hobbies}, 绝育状态: ${c.isNeutered ? '已绝育' : '未绝育'}`;
      }).join('\n');
      
      catContext = `\n【用户猫咪档案】:\n我上传了 ${cats.length} 张猫咪的参考照片（如果有）。请仔细对比主图（第一张图）中的猫咪特征（毛色、花纹、体型），判断是档案中的哪一只猫咪。\n${catsInfo}\n如果主图中没有猫，或者无法确定是哪一只，请泛指“猫咪”或根据画面内容创作。\n`;
    }

    const prompt = `
      请为这张图片/视频（第一张图）撰写一段适合发布在“小红书”的爆款文案。
      
      选定风格：${style.title}
      氛围描述：${style.description}
      视觉风格：${style.visualStyle}
      ${catContext}
      
      要求：
      1. 语言风格：小红书风（种草语气、亲切、富有感染力、适当使用流行语）。
      2. 必须自然地融入大量 Emoji 表情。
      3. 长度：3-5句话，分段清晰，易于阅读。
      4. **关键**：如果识别出是档案中的某只猫咪，请务必使用它的名字，并结合它的性格/爱好进行个性化描写，让文案看起来像是主人亲自写的（活人感）。
      5. 提供 10 个高热度话题标签（混合宽泛话题和垂直话题）。
      6. 输出纯 JSON 格式。
      7. 必须包含一个吸引人的标题（Title）和正文内容（Caption）。
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const text = response.text;
    if(!text) throw new Error("No text generated");

    return JSON.parse(text);

  } catch (error) {
    console.error("Caption generation failed:", error);
    return {
      title: "✨ 捕捉到一只超可爱的喵星人！",
      caption: "今天的心情被这个小可爱治愈了，无论是发呆还是玩耍都超级迷人，忍不住想吸一口～ 💖\n\n铲屎官的快乐就是这么简单！",
      hashtags: ["#猫咪", "#萌宠", "#治愈系", "#猫咪日常", "#铲屎官", "#可爱", "#吸猫", "#今日份快乐", "#宠物", "#喵星人"]
    };
  }
};

/**
 * Regenerates specific parts of the content (Caption or Overlay Text).
 */
export const regenerateSpecificContent = async (
  content: UploadedContent, 
  style: TrendStyle, 
  type: 'caption' | 'overlay',
  cats?: CatProfile[]
): Promise<string | { title: string; caption: string; hashtags: string[] }> => {
  try {
    const model = 'gemini-3-flash-preview'; 
    const isCaption = type === 'caption';

    let catContext = "";
    if (isCaption && cats && cats.length > 0) {
      const catsInfo = cats.map(c => 
        `- 名字: ${c.name}, 品种: ${c.breed}, 性格: ${c.personality}`
      ).join('; ');
      catContext = `提及猫咪: ${catsInfo}。`;
    }

    const parts: any[] = [
      {
        inlineData: {
          mimeType: content.mimeType,
          data: content.base64
        }
      }
    ];

    if (isCaption) {
      const prompt = `
        请重写这篇小红书笔记的完整内容。
        风格：${style.title} (${style.description})。
        ${catContext}
        
        要求：
        1. 重新生成一个吸引人的【标题】。
        2. 重新撰写【正文文案】，简短、种草风、多Emoji。
        3. 重新生成10个相关的【话题标签】。
        4. 必须输出纯 JSON 格式。
      `;
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              caption: { type: Type.STRING },
              hashtags: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "caption", "hashtags"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No text generated");
      return JSON.parse(text);

    } else {
      // Overlay generation (keep as string)
      const prompt = `请重新设计一个简短的中文画面花字/贴纸文案（Overlay Text）。风格：${style.title}。要求：不超过8个字，极具网感，吸睛。只返回文字。`;
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts }
      });

      return response.text?.trim() || "超赞瞬间";
    }

  } catch (error) {
    console.error("Regeneration failed:", error);
    if (type === 'caption') {
      return {
        title: "生成失败",
        caption: "AI 正在休息，请稍后再试...",
        hashtags: []
      };
    }
    return "美好时刻";
  }
};