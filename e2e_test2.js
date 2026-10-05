// Lean E2E test for analyze-test endpoint
// Shorter prompt to reduce server-side compute and improve 503 recovery odds

const BASE = 'http://localhost:3000';

// Minimal curriculum matching the Biology test questions
const CURRICULUM = {
  subject: 'Biology',
  subjectId: 'bio',
  totalUnits: 2,
  totalTopics: 6,
  summary: 'IGCSE Biology core topics',
  units: [
    {
      id: 'bio:u1',
      title: 'Unit 1: Cell Biology',
      topics: [
        { id: 'bio:t1', name: 'Cell membrane', subtopics: ['Phospholipid bilayer', 'Cholesterol function', 'Glycoproteins'], subtopicIds: ['bio:st1-1', 'bio:st1-2', 'bio:st1-3'] },
        { id: 'bio:t2', name: 'Diffusion and osmosis', subtopics: ['Osmosis', 'Plasmolysis', 'Simple diffusion'], subtopicIds: ['bio:st2-1', 'bio:st2-2', 'bio:st2-3'] },
        { id: 'bio:t3', name: 'Mitosis', subtopics: ['Interphase', 'Prophase', 'Metaphase', 'Anaphase', 'Telophase', 'Cytokinesis'], subtopicIds: ['bio:st3-1', 'bio:st3-2', 'bio:st3-3', 'bio:st3-4', 'bio:st3-5', 'bio:st3-6'] },
      ],
    },
    {
      id: 'bio:u2',
      title: 'Unit 2: Molecules and Energy',
      topics: [
        { id: 'bio:t4', name: 'DNA structure', subtopics: ['Base pairing rules', 'Double helix', 'Sugar-phosphate backbone', 'Hydrogen bonds'], subtopicIds: ['bio:st4-1', 'bio:st4-2', 'bio:st4-3', 'bio:st4-4'] },
        { id: 'bio:t5', name: 'Photosynthesis', subtopics: ['Light-dependent reaction', 'Calvin cycle', 'Chlorophyll'], subtopicIds: ['bio:st5-1', 'bio:st5-2', 'bio:st5-3'] },
        { id: 'bio:t6', name: 'Proteins and enzymes', subtopics: ['Active site', 'Lock and key model', 'Denaturation'], subtopicIds: ['bio:st6-1', 'bio:st6-2', 'bio:st6-3'] },
      ],
    },
  ],
};

// Concise test — 4 questions, 20 marks, clearly marked
const TEST_TEXT = `IGCSE Biology Test  Total: 20 marks  Score: 13/20

Q1 (5 marks, scored 3/5) – Cell Membrane
Describe the fluid mosaic model. Student wrote: phospholipid bilayer with embedded proteins.
Marker: missing cholesterol and glycoproteins. Concept mistake. -2 marks.

Q2 (5 marks, scored 5/5) – Diffusion and Osmosis
Define osmosis; what happens to a plant cell in hypertonic solution? Student: water moves by osmosis from high to low; cell becomes plasmolysed. Marker: correct. Full marks.

Q3 (5 marks, scored 2/5) – Mitosis
List the stages of mitosis. Student: prophase, metaphase, anaphase, telophase. Marker: missing interphase and cytokinesis. Concept mistake. -3 marks.

Q4 (5 marks, scored 3/5) – DNA Structure
Describe the structure of DNA. Student: double helix of nucleotides with A, T, G, C bases. Marker: missing sugar-phosphate backbone details and hydrogen bonds. Concept mistake. -2 marks.`;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  console.log('=== REBOUND E2E: Biology Test Analysis (lean) ===\n');

  const t = Date.now();
  const result = await post('/api/gemini/analyze-test', {
    subject: 'Biology',
    totalMarks: 20,
    scoredMarks: 13,
    rawText: TEST_TEXT,
    curriculum: CURRICULUM,
    allowUploadedWork: true,
    personalizedAi: false,
    previousTests: [],
  });
  const elapsed = Date.now() - t;
  console.log(`HTTP ${result.status} in ${elapsed}ms`);

  if (result.status !== 200 || result.json.error) {
    console.error('FAILED:', JSON.stringify(result.json, null, 2));
    process.exit(1);
  }

  const a = result.json;
  console.log('\n✓ ANALYSIS SUCCEEDED');
  console.log(`  Score:      ${a.score}/${a.totalMarks} (${a.percentage}%)`);
  console.log(`  Coverage:   ${a.coverage}`);
  console.log(`  Encouragement: "${(a.encouragement || '').slice(0, 90)}..."`);
  console.log(`\n  Mistakes: concept=${a.mistakeSummary?.conceptMistakes} careless=${a.mistakeSummary?.carelessMistakes} q_understanding=${a.mistakeSummary?.questionUnderstandingMistakes} nED=${a.mistakeSummary?.unidentified}`);
  console.log(`  Questions analysed: ${a.questionsBreakdown?.length}`);
  console.log(`\n  Topic breakdown:`);
  for (const tb of (a.topicBreakdown || [])) {
    console.log(`    - ${tb.topic}: mastery=${tb.mastery ?? 'N/A'}%  status=${tb.status}  lostMarks=${tb.lostMarks}`);
  }
  console.log(`\n  Next target: "${a.nextTarget?.topic}" (${a.nextTarget?.opportunityMarks} marks)`);
  console.log(`  Recovery steps: ${a.nextTarget?.recoveryPlan?.length}`);
  console.log('\n=== PASS ✓ ===');
}

main().catch(err => { console.error(err); process.exit(1); });
