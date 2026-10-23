// Which questions and which card text an answer came from (#29 review). run.mjs records both with
// every answer; an answer is reused when resuming a batch, or scored, only if both still match.
import { createHash } from 'node:crypto'

const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12)

// The whole questions file (the prompt): any change makes a new version.
export const questionsVersion = (questions) => digest(questions)

// Exactly what the model sees of a card, the same fields a real submission stores. The expected
// answer is not part of it: relabelling a card does not change what the model answered, and
// scoring always uses the current labels.
export const modelState = (card) => ({
  nickname: card.card.nickname,
  text_gratitude: card.card.text_gratitude,
  text_anticipate: card.card.text_anticipate,
})

export const cardVersion = (card) => digest(modelState(card))

// Why these answers cannot be reused or scored with the current questions and cards, one line per
// reason; empty when they can. Every answer must come from the current questions, and every answer
// for a card in `cards` from that card's current text. Counts only: card ids stay off the console.
export function staleAnswers(answers, cards, currentQuestions) {
  const text = new Map(cards.map((card) => [card.id, cardVersion(card)]))
  const otherQuestions = answers.filter((answer) => answer.questions_version !== currentQuestions)
  const forCards = answers.filter((answer) => text.has(answer.id))
  const untracked = forCards.filter((answer) => answer.card_version === undefined)
  const changed = forCards.filter((answer) => answer.card_version !== undefined && answer.card_version !== text.get(answer.id))
  const versions = [...new Set(otherQuestions.map((answer) => answer.questions_version ?? 'not recorded'))]
  return [
    otherQuestions.length && `${answers_(otherQuestions)} to other questions (${versions.join(', ')}; the current questions are ${currentQuestions})`,
    untracked.length && `${answers_(untracked)} recorded before card text was tracked`,
    changed.length && `${answers_(changed)} for card text that has changed since`,
  ].filter(Boolean)
}

const answers_ = (list) => `${list.length} answer${list.length === 1 ? '' : 's'}`
