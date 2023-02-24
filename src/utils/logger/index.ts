import { Metadata, squelch, timeAndLogCallback, timeCallback } from './measure'
import { send } from './service'

export interface TimingOptions<T> {
  /**
   * Metadata to include with the timing. This will be passed to the server as-is, and must be serializable.
   * If the metadata must be derived from the callback result, it should be returned from {@link onResult} instead.
   */
  metadata?: Metadata
  /** Returns metadata to include with the timing. This will be passed to the server as-is, and must be serializable. */
  onResult?: (result: T, metadata?: Metadata) => Metadata
  /** If true, the timing's descendants will not be logged. */
  squelch?: boolean
  /** If true, the timing (and its descendants) will be logged to the console. */
  debug?: boolean
}

/** Logs a timing from a callback. */
export async function time<T>(name: string, callback: () => Promise<T>, options?: TimingOptions<T>): Promise<T> {
  return timeAndLogCallback<T>(
    name,
    options?.squelch ? squelch(name, callback) : callback,
    (measures) => {
      if (options?.debug) {
        const measure = measures[measures.length - 1]
        console.groupCollapsed(`${measure.name} took ${measure.duration}ms`)
        console.table(measures, ['name', 'startTime', 'duration'])
        console.groupEnd()
      }
      send(measures)
    },
    options?.metadata,
    options?.onResult
  )
}

const windowFetch = window.fetch
/**
 * Logs a timing from a fetch.
 * @param onResponse - if not specified, marks 5xx status codes as errors ({@link errorOn5xx}).
 * @example
 * // Instead of fetch(url, options)
 * fetch('timing name', url, options)
 */
export async function fetch(
  name: string,
  input: RequestInfo,
  init?: RequestInit,
  onResponse: (response: Response) => Metadata = errorOn5xx
): Promise<Response> {
  const url = typeof input === 'string' ? input : (input as Request).url
  return timeAndLogCallback<Response>(name, () => windowFetch(input, init), send, { url }, onResponse)
}

/** Wraps a callback so that it is included in any logged timings. */
export function wrap<T>(name: string, callback: () => Promise<T>, options?: TimingOptions<T>): Promise<T> {
  return timeCallback(name, options?.squelch ? squelch(name, callback) : callback, options?.metadata, options?.onResult)
}

/** Marks 5xx status codes as errors. */
export function errorOn5xx(response: Response): { status: string; error?: string } {
  const error = response.status >= 500 && response.status < 600 ? response.statusText : undefined
  return { status: response.status.toString(), error }
}
