import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { safeMarkdownUrl } from '../utils/safeUrl';

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type SlidePlan = {
  type: string;
  title: string;
  bullets?: string[];
  notes?: string;
};

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type EducationResult =
  | { kind: 'summary'; documentName: string; summary: string }
  | {
      kind: 'quiz';
      documentId: string;
      documentName: string;
      title: string;
      difficulty: QuizDifficulty;
      questions: QuizQuestion[];
    }
  | { kind: 'slides'; documentName: string; title: string; subtitle?: string; slides: SlidePlan[] };

interface Props {
  result: EducationResult;
  onClose: () => void;
  onMakeHarder?: () => void;
  harderPending?: boolean;
}

export function EducationResultPanel({ result, onClose, onMakeHarder, harderPending }: Props) {
  const heading =
    result.kind === 'summary'
      ? `Summary · ${result.documentName}`
      : result.kind === 'quiz'
        ? `${result.title || 'Quiz'} · ${result.documentName}`
        : `${result.title || 'Slides'} · ${result.documentName}`;

  return (
    <section className="education-result" aria-live="polite">
      <header>
        <h3>{heading}</h3>
        <div className="education-result-actions">
          {result.kind === 'slides' && (
            <button type="button" onClick={() => downloadSlideOutline(result)}>
              Download outline
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close result">
            ×
          </button>
        </div>
      </header>

      {result.kind === 'summary' && <MarkdownBody text={result.summary} />}

      {result.kind === 'quiz' && (
        <QuizPlayer
          questions={result.questions}
          difficulty={result.difficulty}
          harderPending={harderPending}
          onMakeHarder={onMakeHarder}
        />
      )}

      {result.kind === 'slides' && (
        <>
          {result.subtitle ? <p>{result.subtitle}</p> : null}
          <ol>
            {result.slides.map((slide, index) => (
              <li key={`${index}-${slide.title}`}>
                <strong>
                  {slide.title}
                  {slide.type ? ` · ${slide.type.replace(/_/g, ' ')}` : ''}
                </strong>
                {slide.bullets?.length ? (
                  <ul>
                    {slide.bullets.map((bullet) => (
                      <li key={bullet}>
                        <MarkdownBody inline text={bullet} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {slide.notes ? <MarkdownBody text={slide.notes} /> : null}
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function QuizPlayer({
  questions,
  difficulty,
  harderPending,
  onMakeHarder,
}: {
  questions: QuizQuestion[];
  difficulty: QuizDifficulty;
  harderPending?: boolean;
  onMakeHarder?: () => void;
}) {
  const [items, setItems] = useState(questions);
  const [draft, setDraft] = useState(questions);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [picks, setPicks] = useState<Array<number | null>>(() => questions.map(() => null));
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    setItems(questions);
    setDraft(questions);
    setEditing(false);
    setGraded(false);
    setPicks(questions.map(() => null));
  }, [questions]);

  const answered = picks.filter((pick) => pick != null).length;
  const correctCount = graded
    ? items.filter((item, index) => picks[index] === item.answerIndex).length
    : 0;

  const choose = (questionIndex: number, optionIndex: number) => {
    if (graded || editing) return;
    setPicks((current) => current.map((pick, index) => (index === questionIndex ? optionIndex : pick)));
  };

  const updateDraft = (questionIndex: number, patch: Partial<QuizQuestion>) => {
    setDraft((current) => current.map((item, index) => (index === questionIndex ? { ...item, ...patch } : item)));
  };

  const saveEdits = () => {
    const next = draft.map((item) => ({
      ...item,
      question: item.question.trim(),
      options: item.options.map((option) => option.trim()),
      explanation: item.explanation.trim(),
      answerIndex: Math.min(Math.max(item.answerIndex, 0), Math.max(item.options.length - 1, 0)),
    }));
    if (next.some((item) => !item.question || item.options.some((option) => !option))) return;
    setItems(next);
    setDraft(next);
    setEditing(false);
    setGraded(false);
    setPicks(next.map(() => null));
  };

  const copyQuiz = async () => {
    const lines = items.map((item, index) => {
      const choices = item.options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}) ${option}`).join('\n');
      const answer = String.fromCharCode(65 + item.answerIndex);
      return `${index + 1}. ${item.question}\n${choices}\nAnswer: ${answer}\n${item.explanation}`;
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="quiz-player">
      <div className="quiz-toolbar">
        <p className="quiz-progress">
          {graded
            ? `Score: ${correctCount}/${items.length}`
            : `${answered} of ${items.length} answered · ${difficulty}`}
        </p>
        <div className="quiz-toolbar-actions">
          <button type="button" onClick={() => { setDraft(items); setEditing((open) => !open); }}>
            {editing ? 'Close edit' : 'Edit'}
          </button>
          <button type="button" onClick={copyQuiz}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {items.map((item, questionIndex) => {
        const picked = picks[questionIndex];
        const missed = graded && picked !== item.answerIndex;
        return (
          <article className="quiz-card" key={`${questionIndex}-${item.question}`}>
            {editing ? (
              <label className="quiz-edit-field">
                <span>Question {questionIndex + 1}</span>
                <textarea
                  value={draft[questionIndex]?.question ?? ''}
                  rows={2}
                  onChange={(event) => updateDraft(questionIndex, { question: event.target.value })}
                />
              </label>
            ) : (
              <p className="quiz-question">
                {questionIndex + 1}. <MarkdownBody inline text={item.question} />
              </p>
            )}
            <div className="quiz-options" role="radiogroup" aria-label={item.question}>
              {(editing ? draft[questionIndex]?.options ?? item.options : item.options).map((option, optionIndex) => {
                const selected = editing ? draft[questionIndex]?.answerIndex === optionIndex : picked === optionIndex;
                const isAnswer = optionIndex === item.answerIndex;
                const state = editing
                  ? selected
                    ? 'selected'
                    : ''
                  : !graded
                    ? selected
                      ? 'selected'
                      : ''
                    : isAnswer
                      ? 'correct'
                      : selected
                        ? 'wrong'
                        : '';
                if (editing) {
                  return (
                    <label key={optionIndex} className={`quiz-option quiz-edit-option ${state}`}>
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={selected}
                        aria-label="Mark as the correct answer"
                        onChange={() => updateDraft(questionIndex, { answerIndex: optionIndex })}
                      />
                      <input
                        value={option}
                        onChange={(event) => {
                          const options = [...(draft[questionIndex]?.options ?? item.options)];
                          options[optionIndex] = event.target.value;
                          updateDraft(questionIndex, { options });
                        }}
                      />
                    </label>
                  );
                }
                return (
                  <button
                    key={`${optionIndex}-${option}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={graded}
                    className={`quiz-option ${state}`}
                    onClick={() => choose(questionIndex, optionIndex)}
                  >
                    <span className="quiz-radio" aria-hidden="true" />
                    <MarkdownBody inline text={option} />
                  </button>
                );
              })}
            </div>
            {editing ? (
              <label className="quiz-edit-field">
                <span>Explanation</span>
                <textarea
                  value={draft[questionIndex]?.explanation ?? ''}
                  rows={2}
                  onChange={(event) => updateDraft(questionIndex, { explanation: event.target.value })}
                />
              </label>
            ) : missed && item.explanation ? (
              <div className="quiz-explain">
                <MarkdownBody text={item.explanation} />
              </div>
            ) : null}
          </article>
        );
      })}
      <div className="quiz-actions">
        {editing ? (
          <button type="button" onClick={saveEdits}>
            Save quiz
          </button>
        ) : !graded ? (
          <button type="button" disabled={answered < items.length} onClick={() => setGraded(true)}>
            Check answers
          </button>
        ) : (
          <button type="button" disabled={!onMakeHarder || harderPending} onClick={onMakeHarder}>
            {harderPending ? 'Making a harder quiz…' : 'Make Harder'}
          </button>
        )}
      </div>
    </div>
  );
}

function MarkdownBody({ text, inline = false }: { text: string; inline?: boolean }) {
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag className={inline ? 'markdown-body markdown-inline' : 'markdown-body'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        urlTransform={safeMarkdownUrl}
        components={inline ? { p: ({ children }) => <span>{children}</span> } : undefined}
      >
        {text}
      </ReactMarkdown>
    </Tag>
  );
}

function downloadSlideOutline(result: Extract<EducationResult, { kind: 'slides' }>) {
  const lines = [`${result.title}`, result.subtitle ?? '', `Source: ${result.documentName}`, ''];
  result.slides.forEach((slide, index) => {
    lines.push(`Slide ${index + 1}: ${slide.title}`);
    slide.bullets?.forEach((bullet) => lines.push(`- ${bullet}`));
    if (slide.notes) lines.push(`Notes: ${slide.notes}`);
    lines.push('');
  });
  const blob = new Blob([lines.filter((line, index) => line !== '' || index > 0).join('\n')], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${result.documentName.replace(/[^a-z0-9]+/gi, '-')}-slides.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
