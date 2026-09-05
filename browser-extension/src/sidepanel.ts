import { MY_ASSISTANT_HEALTH_URL, MY_ASSISTANT_URL } from './linkedin-workspace.protocol.js';

const offline: HTMLElement = requireElement('offline');
const frame: HTMLIFrameElement = requireFrame('workspace');
const retry: HTMLButtonElement = requireButton('retry');
const diagnostic: HTMLElement = requireElement('diagnostic');

retry.addEventListener('click', (): void => { void connect(); });
void connect();

async function connect(): Promise<void> {
  retry.disabled = true;
  diagnostic.textContent = 'Kapcsolódás…';
  try {
    const response: Response = await fetch(MY_ASSISTANT_HEALTH_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Health check HTTP ${response.status}`);
    }
    frame.src = MY_ASSISTANT_URL;
    frame.hidden = false;
    offline.hidden = true;
  } catch (error: unknown) {
    frame.hidden = true;
    offline.hidden = false;
    diagnostic.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    retry.disabled = false;
  }
}

function requireElement(id: string): HTMLElement {
  const element: HTMLElement | null = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing side-panel element #${id}.`);
  }
  return element;
}

function requireFrame(id: string): HTMLIFrameElement {
  const element: HTMLElement = requireElement(id);
  if (!(element instanceof HTMLIFrameElement)) {
    throw new Error(`#${id} must be an iframe.`);
  }
  return element;
}

function requireButton(id: string): HTMLButtonElement {
  const element: HTMLElement = requireElement(id);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`#${id} must be a button.`);
  }
  return element;
}
