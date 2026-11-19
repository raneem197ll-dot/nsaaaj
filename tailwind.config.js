/** Tailwind scans the HTML and every JS view file, because views are built as template strings. */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', surface2: 'var(--surface-2)', surface3: 'var(--surface-3)',
        ink: 'var(--text)', ink2: 'var(--text-2)', muted: 'var(--muted)', line: 'var(--line)',
        gold: 'var(--gold)', good: 'var(--good)', warn: 'var(--warn)', crit: 'var(--crit)',
        sdec: 'var(--s-declared)', sass: 'var(--s-assessed)', seva: 'var(--s-evaluated)', sver: 'var(--s-verified)'
      },
      fontFamily: { display: ['var(--font-display)'], body: ['var(--font-body)'], mono: ['var(--font-mono)'], ar: ['var(--font-ar)'] },
      screens: { xs: '420px' }
    }
  },
  plugins: []
};
