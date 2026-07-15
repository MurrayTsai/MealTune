// MealTune - Keyword food matching (no AI API needed)
import { calculateFoodNutrition, getFoodById, FOOD_DATABASE } from '../data/foodDatabase.js';

export async function parseMealText(text) {
  return keywordParse(text);
}

const keywordMap = {
  "全麦面包": "bread_whole_wheat",
  "三文鱼": "salmon_raw",
  "鸡胸肉": "chicken_breast_raw",
  "鸡腿肉": "chicken_leg_skinless",
  "西兰花": "broccoli",
  "面包": "bread_white",
  "鸡胸": "chicken_breast_raw",
  "鸡蛋": "egg_whole",
  "牛肉": "beef_lean",
  "猪肉": "pork_lean",
  "豆腐": "tofu_firm",
  "菠菜": "spinach",
  "白菜": "chinese_cabbage",
  "黄瓜": "cucumber",
  "番茄": "tomato",
  "苹果": "apple",
  "香蕉": "banana",
  "牛奶": "milk_whole",
  "馒头": "steamed_bun",
  "油条": "youtiao",
  "玉米": "corn_cooked",
  "红薯": "sweet_potato_cooked",
  "紫薯": "purple_potato_cooked",
  "土豆": "potato_cooked",
  "山药": "chinese_yam",
  "鸡腿": "chicken_leg_skinless",
  "羊肉": "lamb_lean",
  "鸭肉": "duck_skinless",
  "鳕鱼": "cod",
  "橙子": "orange",
  "可乐": "cola",
  "啤酒": "beer",
  "咖啡": "coffee_black",
  "面条": "noodle_cooked",
  "意面": "pasta_cooked",
  "燕麦": "oatmeal",
  "糙米": "rice_brown_cooked",
  "酸奶": "yogurt_plain",
  "豆浆": "soy_milk_unsweetened",
  "饭": "rice_cooked",
  "面": "noodle_cooked",
  "虾": "shrimp",
  "牛": "beef_lean",
  "肉": "pork_lean",
  "鱼": "white_fish_steamed",
  "蛋": "egg_whole",
  "菜": "bok_choy",
  "油": "olive_oil"
}

// Precompute 2-char substrings (bigrams) from all food names for disambiguation
const foodNameBigrams = new Set();
for (const f of FOOD_DATABASE) {
  for (let i = 0; i < f.name.length - 1; i++) {
    foodNameBigrams.add(f.name.substring(i, i + 2));
  }
}

const defaultWeights = {
  grain: 150, protein: 100, vegetable: 100, fruit: 150,
  fat: 10, legume: 50, condiment: 10, snack: 50, dairy: 200,
  beverage: 200, dish: 200
};

function keywordParse(text) {
  const results = [];
  const matched = new Set();

  // Step 1: Find ALL keyword occurrences with their positions in the text
  const allMatches = [];
  for (const [kw, id] of Object.entries(keywordMap)) {
    let pos = 0;
    let idx;
    while ((idx = text.indexOf(kw, pos)) !== -1) {
      allMatches.push({ keyword: kw, id, start: idx, end: idx + kw.length });
      pos = idx + kw.length;
    }
  }

  // Step 2: Sort by keyword length (longest first) so specific foods win over generic ones
  allMatches.sort((a, b) => b.keyword.length - a.keyword.length || a.start - b.start);

  // Step 3: Greedily select non-overlapping matches
  // For 1-char keywords adjacent to a longer match, use food-name bigrams to decide
  // if the short keyword is part of the longer food name (e.g., "肉" in "鸡胸肉")
  const claimed = [];
  const selected = [];
  for (const m of allMatches) {
    // Check overlap with already-claimed ranges
    let skip = false;
    for (const r of claimed) {
      if (m.start < r.end && m.end > r.start) { skip = true; break; }
    }
    if (skip) continue;

    // For 1-char keywords touching a longer selected match, check if they form
    // part of a known food name (bigram disambiguation)
    if (m.keyword.length === 1) {
      for (const s of selected) {
        if (s.keyword.length <= 1) continue;
        // m right after s: e.g., "鸡胸" + "肉" → check bigram "胸肉"
        if (m.start === s.end) {
          const bigram = s.keyword[s.keyword.length - 1] + m.keyword;
          if (foodNameBigrams.has(bigram)) { skip = true; break; }
        }
        // m right before s: e.g., "饭" + "鸡胸" → check bigram "饭鸡"
        if (m.end === s.start) {
          const bigram = m.keyword + s.keyword[0];
          if (foodNameBigrams.has(bigram)) { skip = true; break; }
        }
      }
      if (skip) continue;
    }

    selected.push(m);
    claimed.push({ start: m.start, end: m.end });
  }

  // Step 4: Sort selected by position for weight extraction
  selected.sort((a, b) => a.start - b.start);

  // Step 5: For each match, extract weight from the surrounding text context
  for (let i = 0; i < selected.length; i++) {
    const m = selected[i];
    if (matched.has(m.id)) continue;
    matched.add(m.id);
    const food = getFoodById(m.id);
    if (!food) continue;

    // Segment: from end of previous match to start of next match
    const segStart = i > 0 ? selected[i - 1].end : 0;
    const segEnd = i < selected.length - 1 ? selected[i + 1].start : text.length;

    // Try weight before keyword (e.g., "200克米饭") then after (e.g., "米饭200克")
    const beforeText = text.substring(segStart, m.start);
    const afterText = text.substring(m.end, segEnd);
    let weight = extractWeightFromText(beforeText) || extractWeightFromText(afterText);

    // Try standalone weight in words after keyword (e.g., "米饭 200 g")
    if (!weight && afterText) {
      const afterParts = afterText.trim().split(/[\s,，、]+/).filter(Boolean);
      if (afterParts.length >= 1) {
        weight = extractStandaloneWeight(afterParts[0], afterParts[1] || null);
      }
    }

    const finalWeight = weight || defaultWeights[food.category] || 100;
    const nutrition = calculateFoodNutrition(m.id, finalWeight);
    if (nutrition) results.push(nutrition);
  }

  return results;
}

function extractWeightFromText(text) {
  if (!text) return null;
  const halfMatch = text.match(/半(斤|两|碗|盘)/);
  if (halfMatch) {
    if (halfMatch[1] === '斤') return 250;
    if (halfMatch[1] === '两') return 25;
  }
  const patterns = [
    /(\d+(?:\.\d+)?)\s*g(?:ram)?s?\b/i,
    /(\d+(?:\.\d+)?)\s*克/,
    /(\d+(?:\.\d+)?)\s*斤/,
    /(\d+(?:\.\d+)?)\s*两/,
    /(\d+(?:\.\d+)?)\s*公斤/,
    /(\d+(?:\.\d+)?)\s*千克/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      if (pattern.source.includes('斤') && !pattern.source.includes('公斤')) value *= 500;
      else if (pattern.source.includes('两')) value *= 50;
      else if (pattern.source.includes('公斤') || pattern.source.includes('千克')) value *= 1000;
      return Math.round(value);
    }
  }
  return null;
}

function extractStandaloneWeight(currentWord, nextWord) {
  const numMatch = currentWord.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    if (nextWord) {
      if (/^g(?:ram)?s?$/i.test(nextWord) || nextWord === 'g') return value;
      if (nextWord === '克') return value;
      if (nextWord === '斤') return Math.round(value * 500);
      if (nextWord === '两') return Math.round(value * 50);
      if (nextWord === '公斤' || nextWord === '千克') return Math.round(value * 1000);
    }
    if (value > 10) return value;
    return null;
  }
  const compact = currentWord.match(/^(\d+(?:\.\d+)?)([gG克斤两]|ml|毫升)$/);
  if (compact) {
    let value = parseFloat(compact[1]);
    const unit = compact[2];
    if (unit === '斤') value *= 500;
    else if (unit === '两') value *= 50;
    return Math.round(value);
  }
  return null;
}

export async function generateRecommendation(plan, consumed, planType, date) {
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

  if (remaining.calories > 0 && remaining.protein > 15) {
    suggestions.push({ type: 'recommendation', text: '蛋白质还有空间，建议补充优质蛋白：鸡胸、豆腐、鱼虾' });
  }

  if (remaining.carbs > 30 && remaining.calories > 150) {
    suggestions.push({ type: 'recommendation', text: '碳水还有余量，可选择红薯、玉米、全麦面包等慢碳' });
  }

  if (remaining.calories > 100 && (remaining.carbs > 10 || remaining.calories > 200)) {
    suggestions.push({ type: 'recommendation', text: '来点蔬菜增加饱腹感：西兰花、菠菜、黄瓜' });
  }

  if (suggestions.length === 0) {
    suggestions.push({ type: 'insight', text: '今日营养摄入均衡，继续保持！' });
  }

  if (planType === 'exercise_assisted') {
    suggestions.push({ type: 'tip', text: '如有运动安排，可在运动前补充适量碳水' });
  } else if (planType === 'diet_first') {
    suggestions.push({ type: 'tip', text: '注意控制晚餐主食分量，增加蔬菜比例' });
  } else {
    suggestions.push({ type: 'tip', text: '保持三餐规律，确保每餐有蛋白质和蔬菜' });
  }

  return suggestions;
}
