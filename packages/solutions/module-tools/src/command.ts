import type { Command } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { ModuleTools } from './types';
import type { DevCommandOptions, BuildCommandOptions } from './types/command';

export const buildCommand = async (
  program: Command,
  api: PluginAPI<ModuleTools>,
) => {
  const local = await import('./locale');
  const { defaultTsConfigPath } = await import('./constants/dts');

  program
    .command('build')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.build.describe))
    .option('-w, --watch', local.i18n.t(local.localeKeys.command.build.watch))
    .option(
      '--tsconfig [tsconfig]',
      local.i18n.t(local.localeKeys.command.build.tsconfig),
      defaultTsConfigPath,
    )
    .option(
      '-p, --platform [platform...]',
      local.i18n.t(local.localeKeys.command.build.platform),
    )
    .option('--no-dts', local.i18n.t(local.localeKeys.command.build.dts))
    .option('--no-clear', local.i18n.t(local.localeKeys.command.build.noClear))
    .option(
      '-c --config <config>',
      local.i18n.t(local.localeKeys.command.shared.config),
    )
    .action(async (options: BuildCommandOptions) => {
      const { initModuleContext } = await import('./utils/context');
      const context = await initModuleContext(api);
      const { build } = await import('./build');
      await build(api, options, context);
    });
};

export const devCommand = async (
  program: Command,
  api: PluginAPI<ModuleTools>,
) => {
  const local = await import('./locale');
  const { defaultTsConfigPath } = await import('./constants/dts');
  const runner = api.useHookRunners();
  const devToolMetas = await runner.registerDev();

  await runner.beforeDev(devToolMetas);

  const devProgram = program
    .command('dev')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.dev.describe))
    .option(
      '--tsconfig [tsconfig]',
      local.i18n.t(local.localeKeys.command.dev.tsconfig),
      defaultTsConfigPath,
    )
    .action(async (options: DevCommandOptions) => {
      const { initModuleContext } = await import('./utils/context');
      const context = await initModuleContext(api);
      const { dev } = await import('./dev');
      await dev(options, devToolMetas, api, context);
    });

  for (const meta of devToolMetas) {
    if (!meta.subCommands) {
      continue;
    }

    for (const subCmd of meta.subCommands) {
      devProgram.command(subCmd).action(async (options: DevCommandOptions) => {
        const { initModuleContext } = await import('./utils/context');
        const context = await initModuleContext(api);

        // TODO: watch build
        // const { ensureFirstBuild, watchBuild } = await import('./dev');
        // await ensureFirstBuild(api, context, options, {
        //   disableRunBuild: meta.disableRunBuild ?? false,
        //   appDirectory: context.appDirectory,
        // });

        await runner.beforeDevTask(meta);
        await meta.action(options, { isTsProject: context.isTsProject });
        // TODO: watch build
        // await watchBuild(api, context, options, {
        //   disableRunBuild: meta.disableRunBuild ?? false,
        //   appDirectory: context.appDirectory,
        // });
      });
    }
  }
};

export const newCommand = async (program: Command) => {
  const local = await import('./locale');

  program
    .command('new')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.new.describe))
    .option(
      '--config-file <configFile>',
      local.i18n.t(local.localeKeys.command.shared.config),
    )
    .option('--lang <lang>', local.i18n.t(local.localeKeys.command.new.lang))
    .option(
      '-c, --config <config>',
      local.i18n.t(local.localeKeys.command.new.config),
    )
    .option(
      '-d, --debug',
      local.i18n.t(local.localeKeys.command.new.debug),
      false,
    )
    .option(
      '--dist-tag <tag>',
      local.i18n.t(local.localeKeys.command.new.distTag),
    )
    .option('--registry', local.i18n.t(local.localeKeys.command.new.registry))
    .action(async options => {
      const { ModuleNewAction } = await import('@modern-js/new-action');
      const { getLocaleLanguage } = await import(
        '@modern-js/plugin-i18n/language-detector'
      );

      const locale = getLocaleLanguage();

      await ModuleNewAction({ ...options, locale: options.lang || locale });
    });
};

export const upgradeCommand = async (program: Command) => {
  const local = await import('./locale');
  const { defineCommand } = await import('@modern-js/upgrade');
  defineCommand(
    program
      .command('upgrade')
      .option(
        '-c --config <config>',
        local.i18n.t(local.localeKeys.command.shared.config),
      ),
  );
};
