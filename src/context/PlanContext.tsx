'use client'

import { ReactNode, createContext, useContext, useState, useEffect } from 'react'

interface PlanHistory {
  id: string
  type: 'ai' | 'custom'
  name: string
  description: string
  isSaved: boolean
  createdAt: string
  details?: any
}

interface PlanContextType {
  // History management
  aiPlanHistory: PlanHistory[]
  customPlanHistory: PlanHistory[]
  savedPlans: PlanHistory[]
  
  // Actions
  addToHistory: (plan: Omit<PlanHistory, 'id' | 'createdAt'>, type: 'ai' | 'custom') => void
  savePlan: (planId: string) => void
  unsavePlan: (planId: string) => void
  deletePlan: (planId: string, type: 'ai' | 'custom' | 'saved') => void
  clearAllHistory: () => void
  
  // Navigation
  previousPage: string | null
  setPreviousPage: (page: string) => void
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [aiPlanHistory, setAiPlanHistory] = useState<PlanHistory[]>([])
  const [customPlanHistory, setCustomPlanHistory] = useState<PlanHistory[]>([])
  const [savedPlans, setSavedPlans] = useState<PlanHistory[]>([])
  const [previousPage, setPreviousPage] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const savedAiHistory = localStorage.getItem('aiPlanHistory')
    const savedCustomHistory = localStorage.getItem('customPlanHistory')
    const savedSavedPlans = localStorage.getItem('savedPlans')

    if (savedAiHistory) setAiPlanHistory(JSON.parse(savedAiHistory))
    if (savedCustomHistory) setCustomPlanHistory(JSON.parse(savedCustomHistory))
    if (savedSavedPlans) setSavedPlans(JSON.parse(savedSavedPlans))
  }, [])

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem('aiPlanHistory', JSON.stringify(aiPlanHistory))
  }, [aiPlanHistory])

  useEffect(() => {
    localStorage.setItem('customPlanHistory', JSON.stringify(customPlanHistory))
  }, [customPlanHistory])

  useEffect(() => {
    localStorage.setItem('savedPlans', JSON.stringify(savedPlans))
  }, [savedPlans])

  const addToHistory = (plan: Omit<PlanHistory, 'id' | 'createdAt'>, type: 'ai' | 'custom') => {
    const newPlan: PlanHistory = {
      ...plan,
      id: `${type}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    if (type === 'ai') {
      setAiPlanHistory(prev => [newPlan, ...prev.slice(0, 4)]) // Keep last 5
    } else {
      setCustomPlanHistory(prev => [newPlan, ...prev.slice(0, 4)]) // Keep last 5
    }
  }

  const savePlan = (planId: string) => {
    const allPlans = [...aiPlanHistory, ...customPlanHistory]
    const planToSave = allPlans.find(p => p.id === planId)

    if (planToSave) {
      setSavedPlans(prev => [{ ...planToSave, isSaved: true }, ...prev])
    }
  }

  const unsavePlan = (planId: string) => {
    setSavedPlans(prev => prev.filter(p => p.id !== planId))
  }

  const deletePlan = (planId: string, type: 'ai' | 'custom' | 'saved') => {
    if (type === 'ai') {
      setAiPlanHistory(prev => prev.filter(p => p.id !== planId))
    } else if (type === 'custom') {
      setCustomPlanHistory(prev => prev.filter(p => p.id !== planId))
    } else if (type === 'saved') {
      setSavedPlans(prev => prev.filter(p => p.id !== planId))
    }
  }

  const clearAllHistory = () => {
    setAiPlanHistory([])
    setCustomPlanHistory([])
    setSavedPlans([])
  }

  return (
    <PlanContext.Provider
      value={{
        aiPlanHistory,
        customPlanHistory,
        savedPlans,
        addToHistory,
        savePlan,
        unsavePlan,
        deletePlan,
        clearAllHistory,
        previousPage,
        setPreviousPage,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlanHistory() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlanHistory must be used within PlanProvider')
  }
  return context
}
