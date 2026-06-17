import { create } from 'zustand'

export const useInterviewStore = create((set, get) => ({
  session:       null,
  currentIndex:  0,
  answers:       {},      // { [questionId]: EvaluationOut }
  isEvaluating:  false,
  summary:       null,

  setSession: (session) => set({
    session,
    currentIndex: 0,
    answers: {},
    summary: null,
    isEvaluating: false,
  }),

  setEvaluating: (val) => set({ isEvaluating: val }),

  recordAnswer: (questionId, evaluation) => set((state) => ({
    answers: { ...state.answers, [questionId]: evaluation },
    currentIndex: state.currentIndex + 1,
  })),

  setSummary: (summary) => set({ summary }),

  reset: () => set({
    session:      null,
    currentIndex: 0,
    answers:      {},
    summary:      null,
    isEvaluating: false,
  }),

  currentQuestion: () => {
    const { session, currentIndex } = get()
    return session?.questions?.[currentIndex] ?? null
  },

  isComplete: () => {
    const { session, answers } = get()
    if (!session) return false
    return Object.keys(answers).length >= (session.questions?.length ?? 0)
  },
}))
