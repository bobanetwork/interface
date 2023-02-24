import assert from 'assert'

import { LOGGING_KEY, LoggingState, squelch, timeAndLogCallback, timeCallback } from './measure'

describe('measure', () => {
  beforeEach(() => {
    performance.measure = jest.fn().mockImplementation((name, options) => {
      return { name, ...options }
    })
  })

  describe('timeCallback', () => {
    it('resolves', async () => {
      await expect(timeCallback('resolves', () => Promise.resolve('test'))).resolves.toBe('test')
    })

    it('rejects', async () => {
      await expect(timeCallback('rejects', () => Promise.reject('error'))).rejects.toBe('error')
    })

    it('does not log in non-logging zone', async () => {
      const state: LoggingState = { isLogging: false, measures: [] }
      await Zone.current
        .fork({ name: 'parent', properties: { [LOGGING_KEY]: state } })
        .run(() => timeCallback('test', () => Promise.resolve()))
      expect(state.measures).toEqual([])
    })

    it('logs in logging zone', async () => {
      const state: LoggingState = { isLogging: true, measures: [] }
      await Zone.current
        .fork({ name: 'parent', properties: { [LOGGING_KEY]: state } })
        .run(() => timeCallback('test', () => Promise.resolve()))
      expect(state.measures).toEqual([
        expect.objectContaining({
          name: 'test',
          detail: { parent: 'parent' },
          end: expect.any(Number),
          start: expect.any(Number),
        }),
      ])
    })

    it('logs metadata', async () => {
      const state: LoggingState = { isLogging: true, measures: [] }
      await Zone.current.fork({ name: 'parent', properties: { [LOGGING_KEY]: state } }).run(() =>
        timeCallback(
          'test',
          () => Promise.resolve(),
          { a: 'a', b: 'b' },
          (result, metadata) => ({ ...metadata, c: 'c' })
        )
      )
      expect(state.measures).toEqual([
        expect.objectContaining({
          detail: expect.objectContaining({
            a: 'a',
            b: 'b',
            c: 'c',
          }),
        }),
      ])
    })
  })

  describe('timeAndLogCallback', () => {
    beforeEach(() => {
      jest.spyOn(console, 'groupCollapsed')
      jest.spyOn(console, 'groupEnd')
      jest.spyOn(console, 'table')
    })

    it('resolves', async () => {
      await expect(timeAndLogCallback('resolves', () => Promise.resolve('test'), jest.fn())).resolves.toBe('test')
    })

    it('rejects', async () => {
      await expect(timeCallback('rejects', () => Promise.reject('error'))).rejects.toBe('error')
    })

    it('logs', async () => {
      const onMeasures = jest.fn()
      await timeAndLogCallback('test', () => Promise.resolve(), onMeasures, undefined, undefined)
      expect(onMeasures).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'test',
          detail: {},
          end: expect.any(Number),
          start: expect.any(Number),
        }),
      ])
    })

    it('logs metadata', async () => {
      const onMeasures = jest.fn()
      await timeAndLogCallback(
        'test',
        () => Promise.resolve(),
        onMeasures,
        { a: 'a', b: 'b' },
        (result, metadata) => ({ ...metadata, c: 'c' })
      )
      expect(onMeasures).toHaveBeenCalledWith([
        expect.objectContaining({
          detail: expect.objectContaining({
            a: 'a',
            b: 'b',
            c: 'c',
          }),
        }),
      ])
    })

    it('logs the parent zone', async () => {
      const onMeasures = jest.fn()
      const state: LoggingState = { isLogging: true, measures: [] }
      await Zone.current
        .fork({ name: 'parent', properties: { [LOGGING_KEY]: state } })
        .run(() => timeAndLogCallback('test', () => Promise.resolve(), onMeasures))
      expect(onMeasures).toHaveBeenCalledWith([
        expect.objectContaining({
          detail: expect.objectContaining({
            parent: 'parent',
          }),
        }),
      ])
    })

    it('creates a logging zone', async () => {
      await timeAndLogCallback(
        'test',
        async () => {
          expect(Zone.current.name).toBe('test')
          expect(Zone.current.get(LOGGING_KEY)).toEqual(expect.objectContaining({ isLogging: true }))
        },
        jest.fn()
      )
    })

    it('stops logging in zone after resolving', async () => {
      let child: Promise<void> | undefined
      await timeAndLogCallback(
        'test',
        async () => {
          child = Promise.resolve().then(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1))
            expect(Zone.current.name).toBe('test')
            expect(Zone.current.get(LOGGING_KEY)).toEqual(expect.objectContaining({ isLogging: false }))
          })
        },
        jest.fn()
      )
      assert(child)
      await child
    })
  })

  describe('squelch', () => {
    it('resolves', async () => {
      await expect(squelch('resolves', () => Promise.resolve('test'))()).resolves.toBe('test')
    })

    it('rejects', async () => {
      await expect(squelch('rejects', () => Promise.reject('error'))).rejects.toBe('error')
    })

    it('does not log children', async () => {
      const state: LoggingState = { isLogging: true, measures: [] }
      await Zone.current.fork({ name: 'parent', properties: { [LOGGING_KEY]: state } }).run(() =>
        timeCallback(
          'test',
          squelch('squelch', () => timeCallback('child', () => Promise.resolve()))
        )
      )
      expect(state.measures).toEqual([expect.objectContaining({ name: 'test' })])
    })
  })
})
