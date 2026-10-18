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
당신은 대한민국 대표 이슈/법률 숏폼 및 블로그 채널 [세상만사] 전문 작가입니다.
입력된 주제: "${topic}"

아래 JSON 형식에 맞춰 정확히 답변해 주세요:
{
  "script": "1. 강력한 후킹 / 2. 6하원칙 사건 시말 / 3. 관련 법률 및 정책 / 4. 시청자 영향 포인트 / 5. 찬반 질문 / 6. 구독 유도 순서로 구성된 공백 포함 딱 600~650자 정도의 순수 방송용 대본",
  "thumbnail": "1줄: 후킹 질문\\n2줄: 사건 핵심 한 줄\\n3줄: 자극적/궁금증 유발 질문 카피",
  "titles": "1. [클릭유발] 제목 1\\n2. [이슈 중심] 제목 2\\n3. [법률/정책] 제목 3\\n4. [시청자 공감] 제목 4\\n5. [궁금증 유발] 제목 5",
  "hashtags": "#세상만사 #이슈 #뉴스 카테고리와 연관된 핵심 해시태그 15개 (공백 구분)",
  "details": "📌 사건 내용\\n- 사건의 발달 및 주요 사실관계를 핵심 위주로 4~5개 불렛포인트 작성\\n\\n⚖️ 법률 및 정책 기준\\n- 해당 사건과 관련된 법률, 행정 지침, 판례 기준을 구체적으로 설명\\n\\n💰 영향 및 주요 쟁점\\n- 당사자들의 권리, 재산/손해, 시청자들이 주의해야 할 실질적인 영향 설명\\n\\n🔎 핵심 정리\\n- 전체 사건을 한눈에 파악할 수 있는 3~4줄 요약 및 시사점 정리"
}
`;

  try {
    // API 에러 메시지가 지시한 최신 gemini-3.8-flash 모델 엔드포인트 적용
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
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

    if (!result.candidates || result.candidates.length === 0) {
      return res.status(500).json({ error: 'Gemini API 응답 형식이 올바르지 않습니다.' });
    }

    const textResult = result.candidates[0].content.parts[0].text;
    const content = JSON.parse(textResult);

    return res.status(200).json(content);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
