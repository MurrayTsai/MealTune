 // AI Meal Parsing Service
 // Uses localStorage key for API key, falls back to demo mode
 
 import { calculateFoodNutrition, getFoodById, FOOD_DATABASE } from '../data/foodDatabase.js';
 
 const AI_STORAGE_KEY = 'mealtune_ai_config';
 
 export function getAIConfig() {
   try {
     const raw = localStorage.getItem(AI_STORAGE_KEY);
     return raw ? JSON.parse(raw) : null;
   } catch {
     return null;
   }
 }
 
 export function saveAIConfig(config) {
   localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(config));
 }
 
 export function clearAIConfig() {
   localStorage.removeItem(AI_STORAGE_KEY);
 }
 
 export async function parseMealText(text) {
   // Try AI API if configured
   const config = getAIConfig();
   if (config && config.apiKey) {
     try {
       const result = await callAIApi(text, config);
       if (result && result.length > 0) return result;
     } catch {
       // Fall back to demo
     }
   }
   // Demo keyword-based parsing
   return keywordParse(text);
 }
 
 function keywordParse(text) {
   const keywordMap = {
     '米饭': 'rice_cooked', '饭': 'rice_cooked',
     '面条': 'noodle_cooked', '面': 'noodle_cooked',
     '面包': 'bread_white', '馒头': 'steamed_bun',
     '鸡蛋': 'egg_whole', '蛋': 'egg_whole',
     '鸡胸': 'chicken_breast',
     '牛肉': 'beef_lean', '牛': 'beef_lean',
     '猪肉': 'pork_lean', '肉': 'pork_lean',
     '三文鱼': 'salmon', '鱼': 'fish_white',
     '虾': 'shrimp',
     '豆腐': 'tofu_firm',
     '牛奶': 'milk_whole',
     '酸奶': 'yogurt_plain',
     '豆浆': 'soy_milk',
     '西兰花': 'broccoli',
     '菠菜': 'spinach',
     '白菜': 'cabbage',
     '黄瓜': 'cucumber',
     '番茄': 'tomato', '西红柿': 'tomato',
     '胡萝卜': 'carrot',
     '苹果': 'apple',
     '香蕉': 'banana',
     '橙子': 'orange',
     '土豆': 'potato',
     '红薯': 'sweet_potato',
     '玉米': 'corn',
     '油': 'olive_oil',
   };
 
   const defaultWeights = {
     grain: 150, protein: 100, vegetable: 100, fruit: 150,
     fat: 10, legume: 50, condiment: 10, snack: 50
   };
 
  const results = [];
  const matched = new Set();
  const words = text.split(/[,，、\s\n]+/);

  for (const word of words) {
    if (!word) continue;
    let bestMatch = null;
    let bestLen = 0;
    for (const [kw, id] of Object.entries(keywordMap)) {
      if (word.includes(kw) && kw.length > bestLen) {
        bestMatch = id;
        bestLen = kw.length;
      }
    }
    if (bestMatch && !matched.has(bestMatch)) {
      matched.add(bestMatch);
      const food = getFoodById(bestMatch) || FOOD_DATABASE.find(f => f.id === bestMatch);
      if (food) {
        const defaultWeight = defaultWeights[food.category] || 100;
        // Try to extract weight from the word itself (e.g. "米饭600g")
        let weight = extractWeightFromText(word);
        // Also look at the next word for a standalone number (e.g. "米饭 600")
        if (!weight) {
          const wordIdx = words.indexOf(word);
          if (wordIdx < words.length - 1) {
            weight = extractStandaloneWeight(words[wordIdx + 1], wordIdx + 2 < words.length ? words[wordIdx + 2] : null);
          }
        }
        const finalWeight = weight || defaultWeight;
        const nutrition = calculateFoodNutrition(bestMatch, finalWeight);
        if (nutrition) results.push(nutrition);
      }
    }
  }

  // Fallback: scan whole text
  if (results.length === 0) {
    const lowerText = text.toLowerCase();
    for (const [kw, id] of Object.entries(keywordMap)) {
      if (lowerText.includes(kw) && !matched.has(id)) {
        matched.add(id);
        const food = getFoodById(id);
        if (food) {
          const defaultWeight = defaultWeights[food.category] || 100;
          // Try to extract weight from the full text
          const weight = extractWeightFromText(lowerText);
          const finalWeight = weight || defaultWeight;
          const nutrition = calculateFoodNutrition(id, finalWeight);
          if (nutrition) results.push(nutrition);
        }
      }
    }
  }

  return results;
}

// Extract weight from text like "600g", "600克", "600g米饭", "米饭600g"
function extractWeightFromText(text) {
  if (!text) return null;
  // Chinese half-prefix: 半斤, 半两 etc.
  const halfMatch = text.match(/半(斤|两|碗|盘)/);
  if (halfMatch) {
    if (halfMatch[1] === '斤') return 250;
    if (halfMatch[1] === '两') return 25;
  }
  // Numeric patterns: "600g", "600克", "0.5斤", etc.
  const patterns = [
    /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\b/i,
    /(\d+(?:\.\d+)?)\s*克/,
    /(\d+(?:\.\d+)?)\s*斤/,
    /(\d+(?:\.\d+)?)\s*两/,
    /(\d+(?:\.\d+)?)\s*公斤/,
    /(\d+(?:\.\d+)?)\s*千克/,
    /(\d+(?:\.\d+)?)\s*毫升/,
    /(\d+(?:\.\d+)?)\s*ml\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      // Handle Chinese unit conversions
      if (pattern.source.includes('斤') && !pattern.source.includes('公斤')) {
        value = value * 500; // 1斤 = 500g
      } else if (pattern.source.includes('两')) {
        value = value * 50; // 1两 = 50g
      } else if (pattern.source.includes('公斤') || pattern.source.includes('千克')) {
        value = value * 1000; // 1公斤 = 1000g
      }
      return Math.round(value);
    }
  }
  return null;
}

// Extract a standalone weight from a separate word token
// e.g. "米饭" "600" "克" → look at word "600" with next "克"
function extractStandaloneWeight(currentWord, nextWord) {
  // First check if currentWord itself is just a number
  const numMatch = currentWord.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    // Check next word for unit
    if (nextWord) {
      if (/^g(?:ram)?s?$/i.test(nextWord) || nextWord === 'g') return value;
      if (nextWord === '克') return value;
      if (nextWord === '斤') return Math.round(value * 500);
      if (nextWord === '两') return Math.round(value * 50);
      if (nextWord === '公斤' || nextWord === '千克') return Math.round(value * 1000);
    }
    // No unit found, assume it's grams if it's a reasonable food quantity
    if (value > 10) return value;
    // Small numbers (1-10) might be counts, not grams — return null
    return null;
  }
  // Check if currentWord has format like "600g" (number+unit compact)
  const compact = currentWord.match(/^(\d+(?:\.\d+)?)([gG克斤两]|ml|毫升)$/);
  if (compact) {
    let value = parseFloat(compact[1]);
    const unit = compact[2];
    if (unit === '斤') value = value * 500;
    else if (unit === '两') value = value * 50;
    return Math.round(value);
  }
  return null;
}

// AI API call using OpenAI compatible endpoint
async function callAIApi(text, config) {
   const { apiKey, endpoint = 'https://api.openai.com/v1/chat/completions', model = 'gpt-4o-mini' } = config;
 
   const foodList = FOOD_DATABASE.map(f =>
     `"${f.id}": "${f.name}" (每100g: ${f.per100g.cal}kcal, 蛋白质${f.per100g.protein}g, 碳水${f.per100g.carbs}g, 脂肪${f.per100g.fat}g)`
   ).join('\n');
 
   const response = await fetch(endpoint, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${apiKey}`
     },
     body: JSON.stringify({
       model,
       messages: [
         {
           role: 'system',
           content: `你是一个食物营养分析助手。请将用户描述的一餐食物解析为结构化数据。
 从以下食物数据库中选择匹配的食物ID。每项食物估计重量（克）。
 返回JSON数组： [{ "foodId": "id", "weight": 100 }]
 如果用户的描述包含不在数据库中的食物，选择最相似的。
 
 可用食物：
 ${foodList}`
         },
         { role: 'user', content: text }
       ],
       temperature: 0.3,
       response_format: { type: 'json_object' }
     })
   });
 
   if (!response.ok) throw new Error('AI API error: ' + response.status);
   const data = await response.json();
   const parsed = JSON.parse(data.choices[0].message.content);
   const items = parsed.foods || parsed;
   if (!Array.isArray(items)) return [];
 
   return items.map(item => {
     const nutrition = calculateFoodNutrition(item.foodId, item.weight);
     return nutrition || null;
   }).filter(Boolean);
 }
 
 // Generate AI meal recommendation based on current nutrition status
 export async function generateRecommendation(plan, consumed, planType, date) {
   const config = getAIConfig();
   if (config && config.apiKey) {
     try {
       return await callRecommendationAPI(plan, consumed, planType, date, config);
     } catch {}
   }
   return generateLocalRecommendation(plan, consumed, planType);
 }
 
 function generateLocalRecommendation(plan, consumed, planType) {
   const remaining = {
     calories: plan.calories - consumed.calories,
     protein: plan.protein - consumed.protein,
     carbs: plan.carbs - consumed.carbs,
     fat: plan.fat - consumed.fat
   };
 
   const suggestions = [];
 
   if (remaining.calories <= 0) {
     suggestions.push({ type: 'insight', text: '今日热量已达标，注意不要过量进食' });
     return suggestions;
   }
 
   if (remaining.protein > 15) {
     suggestions.push({
       type: 'recommendation',
       text: '蛋白质还有较大空间，建议补充：鸡胸肉、鱼虾、豆腐等优质蛋白',
       foods: [{ id: 'chicken_breast', name: '鸡胸肉', weight: 100 }, { id: 'tofu_firm', name: '老豆腐', weight: 100 }]
     });
   }
 
   if (remaining.carbs > 30) {
     suggestions.push({
       type: 'recommendation',
       text: '碳水化合物还有余量，建议选择：红薯、玉米、全麦面包等慢碳',
       foods: [{ id: 'sweet_potato', name: '红薯', weight: 100 }, { id: 'corn', name: '玉米', weight: 150 }]
     });
   }
 
   if (remaining.carbs > 10 && remaining.calories > 100) {
     suggestions.push({
       type: 'recommendation',
       text: '来点蔬菜增加饱腹感和膳食纤维：西兰花、菠菜、黄瓜',
       foods: [{ id: 'broccoli', name: '西兰花', weight: 100 }, { id: 'cucumber', name: '黄瓜', weight: 100 }]
     });
   }
 
   if (suggestions.length === 0) {
     suggestions.push({ type: 'insight', text: '今日营养摄入均衡，继续保持！' });
   }
 
   if (planType === 'exercise_assisted') {
     suggestions.push({ type: 'tip', text: '如果有运动安排，可在运动前补充适量碳水' });
   } else if (planType === 'diet_first') {
     suggestions.push({ type: 'tip', text: '注意控制晚餐的主食分量，增加蔬菜比例' });
   } else {
     suggestions.push({ type: 'tip', text: '保持三餐规律，确保每餐有蛋白质和蔬菜' });
   }
 
   return suggestions;
 }
 
 async function callRecommendationAPI(plan, consumed, planType, date, config) {
   const { apiKey, endpoint = 'https://api.openai.com/v1/chat/completions', model = 'gpt-4o-mini' } = config;
 
   const prompt = `你是MealTune的营养顾问。用户当前的营养状况：
 计划类型：${planType}
 今日已摄入：${JSON.stringify(consumed)}
 今日目标：${JSON.stringify({ calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fat: plan.fat })}
 
 根据以上信息，为下一餐提供1-2个具体的食物建议（包含食物名称和推荐份量）。
 返回JSON: { "suggestions": [{ "type": "recommendation", "text": "建议内容", "foods": [{"name":"食物","weight":100}] }] }`;
 
   const response = await fetch(endpoint, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
     body: JSON.stringify({ model, messages: [{ role: 'system', content: '你是一个营养顾问，提供简洁具体的饮食建议。' }, { role: 'user', content: prompt }], temperature: 0.5, response_format: { type: 'json_object' } })
   });
 
   if (!response.ok) throw new Error('AI API error');
   const data = await response.json();
   const parsed = JSON.parse(data.choices[0].message.content);
   return parsed.suggestions || [];
 }
