import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCheckInMessage = async (merchantName: string, checkInCount: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `为用户在"${merchantName}"的第${checkInCount}次打卡生成一段简短、有趣、充满活力的中文祝贺语（最多25字）。
      语境是"工体·燃冬冰雪嘉年华"活动。
      语气应该兴奋、游戏化，让人感到惊喜，仿佛NPC在对话。
      只返回纯文本内容。`,
    });
    return response.text?.trim() || `太棒了！你已成功在 ${merchantName} 完成打卡！`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `欢迎来到 ${merchantName}！打卡成功。`;
  }
};

export const generateLuckyFortune = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `为刚刚赢得优惠券的用户生成一句简短的中文好运签文（类似幸运饼干，最多12字）。
      结合"冰雪"、"暖冬"或"好运"的意象，温暖且富有哲理。
      只返回纯文本。`,
    });
    return response.text?.trim() || "愿冬日暖阳与好运常伴你左右！";
  } catch (error) {
    return "祝你今天好运爆棚！";
  }
};

export const generateNextStopRecommendation = async (visitedCount: number, nextMerchantName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `用户正在参加工体冰雪嘉年华打卡游戏。
      用户已打卡 ${visitedCount} 个地点。
      下一个推荐地点是 "${nextMerchantName}"。
      请生成一句简短的（20字以内）引导语，诱惑用户前往下一个地点。
      语气要有挑战性或诱惑力，比如"听说那边有..."或"再坚持一下..."。
      只返回纯文本。`,
    });
    return response.text?.trim() || `下一站 ${nextMerchantName} 正在等你解锁惊喜！`;
  } catch (error) {
    return `加油！下一站 ${nextMerchantName} 还有惊喜等着你！`;
  }
};