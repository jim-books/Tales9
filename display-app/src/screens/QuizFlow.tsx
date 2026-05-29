import { useState } from 'react'
import { quizQuestions, recommendDrink, getDrinkById } from '../data/drinkCatalog'
import type { UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { usePressAction } from './usePressAction'
import './screens.css'

interface QuizFlowProps {
  userColor: UserColor
  onOrder: (drinkId: string) => void
  onNavigate: (screen: PanelScreen) => void
}

type QuizState =
  | { phase: 'questions'; step: number; answers: Record<string, string> }
  | { phase: 'result'; drinkId: string }

export function QuizFlow({ userColor: _userColor, onOrder, onNavigate }: QuizFlowProps): JSX.Element {
  const [state, setState] = useState<QuizState>({
    phase: 'questions',
    step: 0,
    answers: {},
  })
  const { makePressHandlers } = usePressAction()

  if (state.phase === 'questions') {
    const q = quizQuestions[state.step]

    const handleAnswer = (value: string) => {
      const newAnswers = { ...state.answers, [q.id]: value }
      const isLast = state.step === quizQuestions.length - 1
      if (isLast) {
        setState({ phase: 'result', drinkId: recommendDrink(newAnswers) })
      } else {
        setState({ phase: 'questions', step: state.step + 1, answers: newAnswers })
      }
    }

    return (
      <div className="quiz-screen">
        <div className="panel-brand">
          <div className="panel-brand__name">BARCODE</div>
        </div>

        <div className="quiz-screen__content">
          <div className="quiz-screen__intro">
            <h2 className="quiz-title">Flavor Profiler</h2>
            <p className="quiz-step">
              Question {state.step + 1}/{quizQuestions.length}
            </p>
            <p className="quiz-question">{q.question}</p>
          </div>

          <div className="quiz-options">
            <div className="quiz-options__grid">
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="quiz-option"
                  {...makePressHandlers<HTMLButtonElement>(() => handleAnswer(opt.value))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="quiz-option quiz-option--exit"
              {...makePressHandlers<HTMLButtonElement>(() => onNavigate({ view: 'home' }))}
            >
              ← Exit Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  const drink = getDrinkById(state.drinkId)

  return (
    <div className="quiz-screen">
      <div className="panel-brand">
        <div className="panel-brand__name">BARCODE</div>
      </div>

      <div className="quiz-screen__content">
        <div className="quiz-screen__intro">
          <h2 className="quiz-title">Flavor Profiler</h2>
          <p className="quiz-step">Your Match</p>

          <div className="quiz-result">
            <div className="quiz-result__drink">{drink?.name ?? state.drinkId}</div>
            {drink && <p className="quiz-result__desc">{drink.description}</p>}
          </div>
        </div>

        <div className="quiz-options">
          {drink && (
            <button
              type="button"
              className="quiz-option"
              {...makePressHandlers<HTMLButtonElement>(() => onOrder(drink.id))}
            >
              Order This Drink
            </button>
          )}
          <button
            type="button"
            className="quiz-option"
            {...makePressHandlers<HTMLButtonElement>(() =>
              setState({ phase: 'questions', step: 0, answers: {} })
            )}
          >
            Take Quiz Again
          </button>
          <button
            type="button"
            className="quiz-option quiz-option--exit"
            {...makePressHandlers<HTMLButtonElement>(() => onNavigate({ view: 'home' }))}
          >
            ← Exit Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
