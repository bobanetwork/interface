import { Experiment } from '@amplitude/experiment-js-client'
import { useAtom } from 'jotai'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { createContext, ReactNode, useCallback, useContext } from 'react'

interface FeatureFlagsContextType {
  isLoaded: boolean
  flags: Record<string, string>
}

const FeatureFlagContext = createContext<FeatureFlagsContextType>({ isLoaded: false, flags: {} })

export function useFeatureFlagsContext(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw Error('Feature flag hooks can only be used by children of FeatureFlagProvider.')
  } else {
    return context
  }
}

/* update and save feature flag settings */
export const featureFlagSettings = atomWithStorage<Record<string, string>>('featureFlags', {})

export function useUpdateFlag() {
  const [featureFlags, setFeatureFlags] = useAtom(featureFlagSettings)

  return useCallback(
    (featureFlag: string, option: string) => {
      featureFlags[featureFlag] = option
      setFeatureFlags(featureFlags)
    },
    [featureFlags, setFeatureFlags]
  )
}

const DEPLOYMENT = process.env.REACT_APP_AMPLITUDE_EXPERIMENT_DEPLOYMENT

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const localFeatureFlags = useAtomValue(featureFlagSettings)
  let featureFlags
  if (DEPLOYMENT) {
    const experiment = Experiment.initializeWithAmplitudeAnalytics(DEPLOYMENT)
    console.log(experiment.all())
    featureFlags = localFeatureFlags
  } else {
    featureFlags = localFeatureFlags
  }
  const value = {
    isLoaded: true,
    flags: featureFlags,
  }
  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeatureFlagsIsLoaded(): boolean {
  return useFeatureFlagsContext().isLoaded
}

export enum BaseVariant {
  Control = 'control',
  Enabled = 'enabled',
}

export enum FeatureFlag {
  navBar = 'navBar',
  wallet = 'wallet',
  nft = 'nfts',
  redesign = 'redesign',
  tokens = 'tokens',
  tokensNetworkFilter = 'tokensNetworkFilter',
  tokenSafety = 'tokenSafety',
}

export function useBaseFlag(flag: string): BaseVariant {
  switch (useFeatureFlagsContext().flags[flag]) {
    case 'enabled':
      return BaseVariant.Enabled
    case 'control':
    default:
      return BaseVariant.Control
  }
}
