import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/angular-vite';

const stylesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/angular-vite',
  // Storybook's Vite pipeline does not inherit `stylePreprocessorOptions` from
  // angular.json, so `@use 'bands'` has to be resolvable here too. Without this
  // every component stylesheet using the band mixins fails to compile.
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    css: {
      ...viteConfig.css,
      preprocessorOptions: {
        ...viteConfig.css?.preprocessorOptions,
        scss: {
          ...viteConfig.css?.preprocessorOptions?.scss,
          loadPaths: [stylesDir],
        },
      },
    },
  }),
};

export default config;
