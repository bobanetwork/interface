interface TimingsService {
  send(measures: PerformanceMeasure[]): Promise<void>
}

class MockTimingsService implements TimingsService {
  async send(measures: PerformanceMeasure[]) {
    void measures
  }
}

let timingsService: TimingsService = new MockTimingsService()

export function setTimingsService(service: TimingsService) {
  timingsService = service
}

export function send(measures: PerformanceMeasure[]) {
  timingsService.send(measures)
}
