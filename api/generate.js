export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { topic } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해 주세요.' });
  }

  const prompt = `
당신은 대한민국 대표 이슈/법률 숏폼 채널 [세상만사] 전문 작가입니다.
입력된 주제: "${topic}"

아래 JSON 형식에 맞춰 정확히 답변해 주세요:
{
  "script": "1. 강력한 후킹 / 2. 6하원칙 사건 시말 / 3. 관련 법률 및 정책 / 4. 시청자 영향 포인트 / 5. 찬반 질문 / 6. 구독 유도 순서로 구성된 공백 포함 딱 600~650자 정도의 순수 방송용 대본",
  "thumbnail": "3줄 썸네일 카피 (1줄: 후킹, 2줄: 사건핵심, 3줄: 질문)",
  "titles": "클릭률 높은 숏폼 제목 5개",
  "hashtags": "관련 해시태그 10개 (#세상만사 포함)",
  "details": "네이버 블로그 포스팅용 3줄 사건 핵심 요약"
}
`;

  try {
    // gemini-1.5-flash-latest 엔드포인트 적용
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const result = await response.json();

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    const textResult = result.candidates[0].content.parts[0].text;
    const content = JSON.parse(textResult);

    return res.status(200).json(content);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
