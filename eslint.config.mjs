import stylistic from "@stylistic/eslint-plugin";
import angularEslintPlugin from "@angular-eslint/eslint-plugin";
import angularEslintTemplatePlugin from "@angular-eslint/eslint-plugin-template";
import angularEslintTemplateParser from "@angular-eslint/template-parser";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["projects/**/*"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsEslintParser,
      parserOptions: {
        project: ["tsconfig.json"],
        createDefaultProgram: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
      "@angular-eslint": angularEslintPlugin,
      "@stylistic": stylistic,
    },
    rules: {
      ...angularEslintPlugin.configs.recommended.rules,
      "@stylistic/member-delimiter-style": [
        "error",
        {
          multiline: {
            delimiter: "semi",
            requireLast: true,
          },
          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
        },
      ],
      "@typescript-eslint/no-inferrable-types": "off",
      semi: ["error"],
      "no-bitwise": "off",
      "prefer-const": "error",
    },
  },
  {
    files: ["src/app/**/*.html"],
    languageOptions: {
      parser: angularEslintTemplateParser,
    },
    plugins: {
      "@angular-eslint/template": angularEslintTemplatePlugin,
    },
    rules: {
      ...angularEslintTemplatePlugin.configs.recommended.rules,
    },
  },
];