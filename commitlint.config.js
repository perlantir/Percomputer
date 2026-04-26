module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Ensure type is one of the conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'build',    // build system or dependencies
        'chore',    // maintenance tasks
        'ci',       // CI/CD changes
        'docs',     // documentation
        'feat',     // new feature
        'fix',      // bug fix
        'perf',     // performance improvement
        'refactor', // code refactoring
        'revert',   // revert changes
        'style',    // code style (formatting)
        'test',     // adding or updating tests
      ],
    ],
    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Type is required
    'type-empty': [2, 'never'],
    // Scope is optional, but if present must be lowercase
    'scope-case': [2, 'always', 'lower-case'],
    // Description is required
    'subject-empty': [2, 'never'],
    // Description should not end with a period
    'subject-full-stop': [2, 'never', '.'],
    // Description must be at least 5 characters
    'subject-min-length': [1, 'always', 5],
  },
};
