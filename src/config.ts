import consola from 'consola';
import { globSync } from 'glob';
import prompts from 'prompts';
import { SetRequired } from 'type-fest';
import ts from 'typescript';
import { extractEnumEntries } from './helpers';

const DEFAULT_TARGET = ts.ScriptTarget.ES2020;
const DEFAULT_OUTPUT = './types.d.ts';
const TARGET_ENTRIES = extractEnumEntries(ts.ScriptTarget);
const CONFIG_DEFAULT_NAME = 'types-extractor.config.js';

export interface Config {
  /** Target EcmaScript version. */
  target?: ts.ScriptTarget;
  /**
   * Output file name with generated types.
   *
   * @default ./types.d.ts
   */
  output?: string;
  /**
   * List of objects names to be included.
   *
   * @example ['Object', 'Function', 'Array']
   **/
  objects?: string[];
}

export interface ProgramOptions extends Config {
  verbose?: boolean;
  config?: string;
}

export type ResultConfig = SetRequired<Config, 'target' | 'objects' | 'output'>;

export async function resolveConfig(options: ProgramOptions): Promise<ResultConfig> {
  const fileConfig = await readFileConfig(options);

  const promptsResult = await prompts([
    {
      type: () =>
        fileConfig?.target === undefined && options.target === undefined ? 'select' : null,
      name: 'target',
      message: 'Select EcmaScript target version',
      choices: TARGET_ENTRIES.map(([k, v]) => ({ title: k, value: v })),
      initial: DEFAULT_TARGET,
    },
    {
      type: () =>
        fileConfig?.objects === undefined && options.objects === undefined ? 'list' : null,
      name: 'objects',
      message: 'Enter objects names to be included',
      initial: '',
    },
    {
      type: () =>
        fileConfig?.output === undefined && options.output === undefined ? 'text' : null,
      name: 'output',
      message: 'Enter path to output directory',
      initial: DEFAULT_OUTPUT,
    },
  ]);
  const resultConfig: ResultConfig = {
    target: fileConfig?.target ?? options.target ?? promptsResult.target,
    objects: [...(fileConfig?.objects ?? options.objects ?? promptsResult.objects), 'IArguments'],
    output: fileConfig?.output ?? options.output ?? promptsResult.output,
  };
  consola.info(`Result config:`, JSON.stringify(resultConfig, null, 2));

  return resultConfig;
}

async function readFileConfig(programOptions: ProgramOptions): Promise<Config | undefined> {
  consola.verbose('Resolving file config...');
  const configFileName = programOptions.config ?? CONFIG_DEFAULT_NAME;
  const foundConfigs = globSync(configFileName, { withFileTypes: true });
  if (!foundConfigs.length) {
    consola.info(`No file config found`);
  }

  const foundConfigPath = foundConfigs[0].fullpath();
  consola.info(`Found file config: ${foundConfigPath}`);

  return (await import(foundConfigPath)).default;
}
