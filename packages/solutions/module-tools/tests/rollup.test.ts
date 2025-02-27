import path from 'path';
import { fs } from '@modern-js/utils';
import { runRollup, RollupWatcher } from '../src/builder/dts/rollup';

import { initBeforeTest } from './utils';

initBeforeTest();

describe('rollup', () => {
  beforeEach(() => {
    jest.mock('../src/utils/log.ts');
    jest.mock('../src/error.ts');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  const apiMock = {
    useHookRunners: jest.fn(() => {
      return {
        buildWatchDts: jest.fn(),
      };
    }),
  };

  it('watch', async () => {
    const fixtureDir = path.join(__dirname, './fixtures/rollup/base');
    const distDir = path.join(fixtureDir, 'dist');
    const tsconfigPath = path.join(fixtureDir, 'tsconfig.json');
    const input = [path.join(fixtureDir, 'src/index.ts')];
    const watcher = (await runRollup(apiMock as any, {
      distDir,
      tsconfigPath,
      input,
      watch: true,
      externals: [],
      abortOnError: true,
      respectExternal: true,
    })) as RollupWatcher;
    const p = new Promise(resolve => {
      watcher.on('event', async event => {
        if (event.code === 'BUNDLE_END') {
          watcher.removeAllListeners();
          watcher.close();
          resolve(null);
        }
      });
    });
    await p;
    const distPath = path.join(fixtureDir, './dist/index.d.ts');
    expect(await fs.pathExists(distPath)).toBeTruthy();
  });

  it('error', async () => {
    const fixtureDir = path.join(__dirname, './fixtures/rollup/error');
    const distDir = path.join(fixtureDir, 'dist');
    const tsconfigPath = path.join(fixtureDir, 'tsconfig.json');
    const input = [path.join(fixtureDir, 'src/index.ts')];
    let heppenError = false;
    jest.mock('../compiled/rollup', () => {
      return {
        __esModule: true,
        rollup: () => {
          throw new Error();
        },
      };
    });
    try {
      await runRollup(apiMock as any, {
        distDir,
        tsconfigPath,
        input,
        watch: false,
        externals: [],
        abortOnError: true,
        respectExternal: true,
      });
    } catch (_) {
      heppenError = true;
    }

    expect(heppenError).toBeTruthy();
  });
});
