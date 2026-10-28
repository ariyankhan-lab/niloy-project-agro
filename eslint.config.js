import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import refresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
export default tseslint.config(
 { ignores: ['.local', 'dist', 'node_modules', 'playwright-report', 'test-results', 'supabase/functions'] },
 js.configs.recommended, ...tseslint.configs.recommended,
 { files: ['**/*.{js,mjs}'], languageOptions: { globals: globals.node } },
 { files: ['**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, plugins: { 'react-hooks': hooks, 'react-refresh': refresh }, rules: { ...hooks.configs.recommended.rules, 'react-refresh/only-export-components': ['error', { allowConstantExport: true }] } },
)
