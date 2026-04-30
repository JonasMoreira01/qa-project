module.exports = {
  extends: [require.resolve('@inmediam/config/eslint/base.js')],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json'
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off'
  }
};