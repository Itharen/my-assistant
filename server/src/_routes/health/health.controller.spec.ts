import { Health_Controller } from './health.controller.js';

describe('Health controller', (): void => {
  it('registers the open GET /healthz liveness endpoint', (): void => {
    const controller: Health_Controller = Health_Controller.getInstance();
    controller.setupEndpoints();
    expect(controller.endpoints.length).toBe(1);
    expect(controller.endpoints[0]?.endpoint).toBe('/healthz');
  });
});
