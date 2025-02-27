import path from 'path';
import {
  isApiOnly,
  mergeAlias,
  createRuntimeExportsUtils,
} from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import {
  testingHooks,
  TestConfigOperator,
  getModuleNameMapper,
  DEFAULT_RESOLVER_PATH,
} from '../base';
import { MODERNJS_CONFIG_KEY } from '../constant';
import type { Hooks } from '../base/hook';
import type { UserConfig } from '../base/config';
import { testingBffPlugin } from './bff';
import test from './test';

export const mergeUserJestConfig = (testUtils: TestConfigOperator) => {
  const resolveJestConfig = testUtils.testConfig.jest;

  // resolveJestConfig 如果是函数类型，在所有测试插件 jestConfig 都执行后，再执行生成最终配置
  if (resolveJestConfig && typeof resolveJestConfig !== 'function') {
    testUtils.mergeJestConfig(resolveJestConfig);
  }
};

export const testingPlugin = (): CliPlugin<{
  hooks: Hooks;
  userConfig: UserConfig;
  normalizedConfig: Required<UserConfig>;
}> => {
  const bffPlugin = testingBffPlugin();

  return {
    name: '@modern-js/plugin-testing',

    usePlugins: [bffPlugin],

    post: [bffPlugin.name!],

    registerHook: testingHooks,

    setup: api => {
      let testingExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;

      return {
        commands: ({ program }: any) => {
          program
            .command('test')
            .allowUnknownOption()
            .usage('<regexForTestFiles> --[options]')
            .action(async () => {
              await test(api);
            });
        },

        validateSchema() {
          return [
            {
              target: 'testing',
              schema: { typeof: ['object'] },
            },
            {
              target: 'tools.jest',
              schema: { typeof: ['object', 'function'] },
            },
          ];
        },

        config() {
          const appContext = api.useAppContext();

          testingExportsUtils = createRuntimeExportsUtils(
            appContext.internalDirectory,
            'testing',
          );

          return {
            source: {
              alias: {
                // The module-tools alias configuration is different and more specific than app-tools.
                // So for the time being, the @ alias is configured here.
                '@': path.join(appContext.appDirectory, 'src'),
                '@modern-js/runtime/testing/bff': require.resolve(
                  '@modern-js/plugin-testing/bff',
                ),
                '@modern-js/runtime/testing': testingExportsUtils.getPath(),
              },
            },
          };
        },

        addRuntimeExports() {
          const testingPath = path.resolve(__dirname, '../');
          testingExportsUtils.addExport(`export * from '${testingPath}'`);
        },

        jestConfig: async (utils, next) => {
          const appContext = api.useAppContext();
          const userConfig = api.useResolvedConfigContext();

          const apiOnly = await isApiOnly(appContext.appDirectory);

          if (apiOnly) {
            return next(utils);
          }

          const alias = mergeAlias(userConfig.source.alias);

          if (testingExportsUtils) {
            alias['@modern-js/runtime/testing'] = [
              testingExportsUtils.getPath(),
            ];
          }

          utils.mergeJestConfig({
            globals: {
              [MODERNJS_CONFIG_KEY]: userConfig,
            },
            moduleNameMapper: getModuleNameMapper(alias),
            testEnvironment: 'jsdom',
            resolver: DEFAULT_RESOLVER_PATH,
            rootDir: appContext.appDirectory || process.cwd(),
            // testMatch bug on windows, issue: https://github.com/facebook/jest/issues/7914
            testMatch: [
              `<rootDir>/src/**/*.test.[jt]s?(x)`,
              `<rootDir>/tests/**/*.test.[jt]s?(x)`,
            ],
          });

          mergeUserJestConfig(utils);

          return next(utils);
        },
      };
    },
  };
};

export default testingPlugin;
