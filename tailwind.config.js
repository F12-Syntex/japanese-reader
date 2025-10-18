/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    // Manually define themes to match your ThemeSwitcher list
    themes: [
      'light','dark','cupcake','bumblebee','emerald','corporate','synthwave','retro','cyberpunk','valentine',
      'halloween','garden','forest','aqua','lofi','pastel','fantasy','wireframe','black','luxury','dracula',
      'cmyk','autumn','business','acid','lemonade','night','coffee','winter','dim','nord','sunset',
      // Add any custom themes you’ve defined in your CSS as objects, e.g.:
      // {
      //   caramel: {
      //     primary: '#...',
      //     secondary: '#...',
      //     accent: '#...',
      //     neutral: '#...',
      //     'base-100': '#...',
      //     '--rounded-box': '0.5rem',
      //     '--rounded-btn': '0.5rem',
      //   }
      // },
      // If these extra names exist in your build (e.g. custom), include them:
      // 'caramel','caramelLatte','abyss','silk','nexus','vintage','aquaDark'
    ],
    darkTheme: 'forest',
    logs: false,
    base: true,
    styled: true,
    utils: true,
    themeRoot: ':root',
  },
}