import { program } from 'commander';
import consola, { LogLevels } from 'consola';
import ts from 'typescript';
import { version } from '../package.json';
import { type Config, ProgramOptions, resolveConfig } from './config';
import { generateTypes } from './generation';

program
  .name('ts-types')
  .version(version)
  .description('CLI for generating TypeScript .d.ts file based on node_modules')
  .option(
    '-t, --target <version>',
    'target EcmaScript version',
    (value) => ts.ScriptTarget[value as keyof typeof ts.ScriptTarget]
  )
  .option('-o, --output <path>', 'output file path')
  .option('--ob, --objects <objects...>', 'list of objects names to be included')
  .option('-c, --config <path>', 'config file path')
  .option('-v, --verbose', 'show verbose logs')
  .parse();

const options = program.opts<ProgramOptions>();
if (options.verbose) consola.level = LogLevels.verbose;

(async () => {
  const config = await resolveConfig(options);

  consola.start('Generating types...');
  generateTypes(config);
  consola.success(`Generated types to "${config.output}"`);
})();

export { Config };
