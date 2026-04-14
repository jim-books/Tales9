import { useState } from 'react'
import { quizQuestions, recommendDrink, getDrinkById } from '../data/drinkCatalog'
import type { UserColor } from '../types'
import type { PanelScreen } from '../components/PanelScreen'
import { PressableButton } from '../components/PressableButton'
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

  if (state.phase === 'questions') {
    const q = quizQuestions[state.step]
    const progress = (state.step / quizQuestions.length) * 100

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
      <div className="screen">
        <div className="screen-header">
          <PressableButton
            className="screen-back"
            onPress={() => {
              if (state.step === 0) {
                onNavigate({ view: 'home' })
              } else {
                setState({ ...state, step: state.step - 1 })
              }
            }}
          >
            ←
          </PressableButton>
          <span className="screen-header__title">Drink Quiz</span>
        </div>
        <div className="screen-body">
          <div className="quiz-progress">
            <div className="quiz-progress__fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="quiz-step-label">
            Question {state.step + 1} of {quizQuestions.length}
          </div>
          <div className="quiz-question">{q.question}</div>
          <div className="quiz-options">
            {q.options.map((opt) => (
              <PressableButton
                key={opt.value}
                className="quiz-option"
                onPress={() => handleAnswer(opt.value)}
              >
                {opt.label}
              </PressableButton>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Result phase
  const drink = getDrinkById(state.drinkId)

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-header__title" style={{ textAlign: 'center', flex: 1 }}>
          Your Match
        </span>
      </div>
      <div className="screen-body">
        <div className="quiz-result">
          <div className="quiz-result__heading">Your Perfect Match</div>
          <div className="quiz-result__icon">🍷</div>
          <div className="quiz-result__drink">{drink?.name ?? state.drinkId}</div>
          {drink && <p className="quiz-result__desc">{drink.description}</p>}
        </div>

        {drink && (
          <PressableButton className="btn-primary" onPress={() => onOrder(drink.id)}>
            Order This Drink
          </PressableButton>
        )}
        <PressableButton
          className="btn-secondary"
          onPress={() =>
            setState({ phase: 'questions', step: 0, answers: {} })
          }
        >
          Take Quiz Again
        </PressableButton>
        <PressableButton className="btn-secondary" onPress={() => onNavigate({ view: 'menu' })}>
          View Full Menu
        </PressableButton>
        <PressableButton className="btn-ghost" onPress={() => onNavigate({ view: 'home' })}>
          Back to Home
        </PressableButton>
      </div>
    </div>
  )
}
