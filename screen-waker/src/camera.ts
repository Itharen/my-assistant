import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

import ffmpegStaticPath from 'ffmpeg-static';

import type { Frame, ScreenWakerConfig } from './types.js';

const deviceLinePattern: RegExp = /\[dshow[^\]]*]\s+"([^"]+)"\s+\(video\)\s*$/gm;

export function parseDirectShowVideoDevices(output: string): string[] {
  const devices: string[] = [];
  let match: RegExpExecArray | null = deviceLinePattern.exec(output);

  while (match) {
    const name: string | undefined = match[1];
    if (name && !devices.includes(name)) devices.push(name);
    match = deviceLinePattern.exec(output);
  }

  deviceLinePattern.lastIndex = 0;
  return devices;
}

async function collectDeviceList(ffmpegPath: string): Promise<string> {
  return new Promise<string>((resolve: (value: string) => void, reject: (reason: Error) => void): void => {
    const child: ChildProcessWithoutNullStreams = spawn(
      ffmpegPath,
      ['-hide_banner', '-list_devices', 'true', '-f', 'dshow', '-i', 'dummy'],
      { windowsHide: true },
    );
    let stderr: string = '';
    let settled: boolean = false;
    const timeout: NodeJS.Timeout = setTimeout((): void => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error('Camera discovery timed out after 10 seconds'));
    }, 10_000);

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string): void => {
      stderr += chunk;
    });
    child.once('error', (error: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`FFmpeg camera discovery failed: ${error.message}`, { cause: error }));
    });
    child.once('close', (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(stderr);
    });
  });
}

export async function discoverCameraNames(ffmpegPath: string): Promise<string[]> {
  if (process.platform !== 'win32') {
    throw new Error('Screen Waker camera capture is supported only on Windows');
  }

  return parseDirectShowVideoDevices(await collectDeviceList(ffmpegPath));
}

function resolveFfmpegPath(): string {
  const configuredPath: string | undefined = process.env.SCREEN_WAKER_FFMPEG_PATH;
  if (configuredPath) return configuredPath;
  if (!ffmpegStaticPath) throw new Error('ffmpeg-static did not provide a binary for this platform');
  return ffmpegStaticPath;
}

export class CameraCapture {
  private child: ChildProcessWithoutNullStreams | null = null;
  private pendingBytes: Buffer = Buffer.alloc(0);
  private latestFrame: Frame | null = null;
  private waiter: { resolve: (frame: Frame) => void; reject: (error: Error) => void } | null = null;
  private failure: Error | null = null;
  private stopping: boolean = false;
  private stderrTail: string = '';

  public constructor(private readonly config: ScreenWakerConfig) {}

  public async start(): Promise<string> {
    if (this.child) throw new Error('Camera capture is already running');

    const ffmpegPath: string = resolveFfmpegPath();
    const cameraNames: string[] = await discoverCameraNames(ffmpegPath);
    const selectedCamera: string | undefined = cameraNames[this.config.cameraIndex];
    if (!selectedCamera) {
      throw new Error(
        `Camera index ${this.config.cameraIndex} is unavailable; discovered ${cameraNames.length} video device(s)`,
      );
    }

    const fps: number = 1000 / this.config.captureIntervalMs;
    const filter: string = [
      `fps=${fps.toFixed(3)}`,
      `scale=${this.config.processingWidth}:${this.config.processingHeight}:flags=fast_bilinear`,
      'format=gray',
    ].join(',');
    const args: string[] = [
      '-hide_banner',
      '-loglevel',
      'warning',
      '-fflags',
      'nobuffer',
      '-f',
      'dshow',
      '-i',
      `video=${selectedCamera}`,
      '-an',
      '-vf',
      filter,
      '-pix_fmt',
      'gray',
      '-f',
      'rawvideo',
      'pipe:1',
    ];

    this.stopping = false;
    this.failure = null;
    this.pendingBytes = Buffer.alloc(0);
    this.latestFrame = null;
    this.stderrTail = '';
    this.child = spawn(ffmpegPath, args, { windowsHide: true });
    this.child.stdout.on('data', (chunk: Buffer): void => this.acceptBytes(chunk));
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk: string): void => {
      this.stderrTail = `${this.stderrTail}${chunk}`.slice(-4000);
    });
    this.child.once('error', (error: Error): void => this.fail(new Error(`FFmpeg failed: ${error.message}`)));
    this.child.once('exit', (code: number | null, signal: NodeJS.Signals | null): void => {
      if (!this.stopping) {
        const context: string = this.stderrTail.trim();
        const suffix: string = context ? `: ${context}` : '';
        this.fail(new Error(`FFmpeg camera process exited (code=${code}, signal=${signal})${suffix}`));
      }
      this.child = null;
    });

    return selectedCamera;
  }

  public getFrame(): Promise<Frame> {
    if (this.latestFrame) {
      const frame: Frame = this.latestFrame;
      this.latestFrame = null;
      return Promise.resolve(frame);
    }
    if (this.failure) return Promise.reject(this.failure);
    if (!this.child) return Promise.reject(new Error('Camera capture is not running'));
    if (this.waiter) return Promise.reject(new Error('Only one pending getFrame call is supported'));

    return new Promise<Frame>((resolve: (frame: Frame) => void, reject: (error: Error) => void): void => {
      this.waiter = { resolve, reject };
    });
  }

  public stop(): void {
    this.stopping = true;
    if (this.waiter) {
      this.waiter.reject(new Error('Camera capture stopped'));
      this.waiter = null;
    }
    if (this.child) {
      this.child.kill();
    }
  }

  private acceptBytes(chunk: Buffer): void {
    const frameSize: number = this.config.processingWidth * this.config.processingHeight;
    this.pendingBytes = Buffer.concat([this.pendingBytes, chunk]);

    while (this.pendingBytes.length >= frameSize) {
      const data: Uint8Array = new Uint8Array(this.pendingBytes.subarray(0, frameSize));
      this.pendingBytes = this.pendingBytes.subarray(frameSize);
      const frame: Frame = {
        data,
        width: this.config.processingWidth,
        height: this.config.processingHeight,
        capturedAt: Date.now(),
      };

      if (this.waiter) {
        const waiter: { resolve: (value: Frame) => void; reject: (error: Error) => void } = this.waiter;
        this.waiter = null;
        waiter.resolve(frame);
      } else {
        this.latestFrame = frame;
      }
    }
  }

  private fail(error: Error): void {
    if (this.failure || this.stopping) return;
    this.failure = error;
    if (this.waiter) {
      this.waiter.reject(error);
      this.waiter = null;
    }
  }
}
