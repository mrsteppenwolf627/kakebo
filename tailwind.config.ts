/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"], // Assuming Playfair is used for serif
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'inherit',
            a: {
              color: 'var(--primary)',
              textDecoration: 'underline',
              textDecorationColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
              textUnderlineOffset: '4px',
              fontWeight: '500',
              '&:hover': {
                textDecorationColor: 'var(--primary)',
              },
            },
            strong: {
              color: 'inherit',
              fontWeight: '600',
            },
            h2: {
              color: 'inherit',
              marginTop: '2.75rem',
              marginBottom: '0.875rem',
              paddingBottom: '0.5rem',
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--border)',
              lineHeight: '1.35',
            },
            h3: {
              color: 'inherit',
              marginTop: '2rem',
              marginBottom: '0.625rem',
              lineHeight: '1.4',
            },
            'ul > li': {
              marginBottom: '0.35rem',
            },
            'ol > li': {
              marginBottom: '0.35rem',
            },
            hr: {
              borderColor: 'var(--border)',
              marginTop: '2.5rem',
              marginBottom: '2.5rem',
              opacity: '1',
            },
            blockquote: {
              color: 'inherit',
              borderLeftColor: 'var(--primary)',
              fontStyle: 'normal',
              borderLeftWidth: '3px',
            },
            code: {
              color: 'inherit',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};
