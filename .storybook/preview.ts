import type { Preview } from '@storybook/angular-vite';

// Storybook's Angular builder does not inject the `styles` from angular.json
// into the preview iframe, so the global stylesheet has to be imported here.
// Without it every `--aos-*`, `--surface` and `--space-*` custom property is
// undefined and the cards render completely unstyled.
import '../src/styles.scss';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
