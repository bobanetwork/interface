import 'zone.js'

// Logging of "descendant tasks" is accomplished with zone.js. When a callback is logging, any callbacks it triggers
// (including async callbacks) will be triggered in the same zone, and so can be tracked back to the logging "parent"
// callback.

/** Metadata to include with a timing. This will be passed to the server as-is, and must be serializable. */
export type Metadata = Record<string, unknown>

export const LOGGING_KEY = '@uniswap/logging'

export interface LoggingState {
  /**
   * Used to prevent non-blocking async tasks that outlast the instigating task from logging,
   * and to squelch measures from async tasks triggered by code wrapped in {@link squelch}.
   */
  isLogging: boolean
  /** Used to collect PerformanceMeasures across tasks. */
  measures: PerformanceMeasure[]
}

const DEFAULT_STATE: LoggingState = { isLogging: false, measures: [] }

/**
 * Times and logs the callback if it is a descendant of a logged callback
 * (ie if it was triggered by a callback passed to timeAndLogCallback).
 */
export async function timeCallback<T>(
  name: string,
  callback: () => Promise<T>,
  metadata?: Metadata,
  onResult?: (result: T, metadata?: Metadata) => Metadata
): Promise<T> {
  const zone = Zone.current
  const state: LoggingState = zone.get(LOGGING_KEY) ?? DEFAULT_STATE
  const parent = zone.name !== name ? zone.name : zone.parent === Zone.root ? undefined : zone.parent?.name

  const start = performance.now()
  try {
    const result = await callback()
    metadata = onResult?.(result, metadata)
    return result
  } catch (error) {
    metadata = { ...metadata, error: error.toString() }
    throw error
  } finally {
    const end = performance.now()
    if (state.isLogging) {
      const detail = { ...metadata, parent }
      const measure = performance.measure(name, { detail, end, start })
      state.measures.push(measure)
    }
  }
}

/** Initiates a logged timing for the callback and its descendants. */
export async function timeAndLogCallback<T>(
  name: string,
  callback: () => Promise<T>,
  onMeasures: (measures: PerformanceMeasure[]) => void,
  metadata?: Metadata,
  onResult?: (result: T, metadata?: Metadata) => Metadata
): Promise<T> {
  const state: LoggingState = { isLogging: true, measures: [] }
  const zone = Zone.current.fork({ name, properties: { [LOGGING_KEY]: state } })

  try {
    return await zone.run(() => timeCallback(name, callback, metadata, onResult))
  } finally {
    // Prevent non-blocking async tasks (which have a longer lifetime than the forking task) from being logged.
    state.isLogging = false

    onMeasures(state.measures)
  }
}

/** Prevents timings from being logged from the callback's descendants. */
export function squelch<T>(name: string, callback: () => Promise<T>): () => Promise<T> {
  const state: LoggingState = { isLogging: false, measures: [] }
  return () => Zone.current.fork({ name, properties: { [LOGGING_KEY]: state } }).run(callback)
}
