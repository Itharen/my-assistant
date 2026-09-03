import path from 'node:path';

import { CameraCapture } from './camera.js';
import { defaultConfigPath, loadConfig } from './config.js';
import { wakeDisplay } from './displayWake.js';
import { Logger } from './logger.js';
import { MotionDetector } from './motionDetector.js';
import type { Frame, MotionResult, ScreenWakerConfig } from './types.js';
import { WakeCooldown } from './wakeCooldown.js';

function configPathFromArguments(args: string[]): string {
  const configFlagIndex: number = args.indexOf('--config');
  if (configFlagIndex === -1) return process.env.SCREEN_WAKER_CONFIG ?? defaultConfigPath;

  const configuredPath: string | undefined = args[configFlagIndex + 1];
  if (!configuredPath) throw new Error('--config requires a file path');
  return path.resolve(configuredPath);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, milliseconds);
  });
}

async function run(): Promise<void> {
  const configPath: string = configPathFromArguments(process.argv.slice(2));
  let config: ScreenWakerConfig;

  try {
    config = await loadConfig(configPath);
  } catch (error: unknown) {
    const bootstrapLogger: Logger = new Logger(false);
    await bootstrapLogger.error('screen-waker configuration failed', error);
    throw error;
  }

  const logger: Logger = new Logger(config.debug);
  const detector: MotionDetector = new MotionDetector(config);
  const wakeCooldown: WakeCooldown = new WakeCooldown(config.wakeCooldownMs);
  let activeCamera: CameraCapture | null = null;
  let stopping: boolean = false;

  const stop: () => void = (): void => {
    if (stopping) return;
    stopping = true;
    activeCamera?.stop();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  logger.info('screen-waker started');
  await logger.action('external-action', 'screen-waker started', { configPath });

  try {
    while (!stopping) {
      try {
        activeCamera = new CameraCapture(config);
        const cameraName: string = await activeCamera.start();
        const firstFrame: Frame = await activeCamera.getFrame();
        detector.reset();
        detector.detect(firstFrame);
        logger.info(`camera initialized index=${config.cameraIndex} device=${cameraName}`);

        while (!stopping) {
          const frame: Frame = await activeCamera.getFrame();
          const result: MotionResult = detector.detect(frame);
          logger.debug(
            `motion score=${result.score.toFixed(4)} changed=${(result.score * 100).toFixed(1)}% `
              + `frames=${result.motionFrames}/${result.requiredMotionFrames} `
              + `ambientDelta=${result.ambientDelta.toFixed(1)}`,
          );
          if (!result.detected) continue;

          detector.resetConfirmation();
          const now: number = Date.now();
          if (!wakeCooldown.isAllowed(now)) {
            logger.debug('motion confirmed but wake is inside cooldown');
            continue;
          }

          logger.info(`motion detected score=${result.score.toFixed(3)}`);
          try {
            await wakeDisplay();
          } catch (error: unknown) {
            await logger.error('display wake failed', error);
            continue;
          }
          wakeCooldown.recordWake();
          logger.info('display wake sent');
          await logger.action('external-action', 'display wake sent after confirmed camera motion', {
            score: Number(result.score.toFixed(4)),
          });
        }
      } catch (error: unknown) {
        if (!stopping) {
          await logger.error('camera monitoring failed; reconnect scheduled', error);
          logger.info(`camera reconnect in ${config.cameraReconnectMs} ms`);
          await delay(config.cameraReconnectMs);
        }
      } finally {
        activeCamera?.stop();
        activeCamera = null;
      }
    }
  } finally {
    logger.info('screen-waker stopped');
    await logger.action('external-action', 'screen-waker stopped');
  }
}

run().catch((error: unknown): void => {
  const detail: string = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${detail}\n`);
  process.exitCode = 1;
});
