# website

[![Package Version](https://img.shields.io/hexpm/v/website)](https://hex.pm/packages/website)
[![Hex Docs](https://img.shields.io/badge/hex-docs-ffaff3)](https://hexdocs.pm/website/)

```sh
gleam add website@1
```
```gleam
import website

pub fn main() -> Nil {
  // TODO: An example of the project in use
}
```

Further documentation can be found at <https://hexdocs.pm/website>.

## Development

```sh
gleam run   # Run the project
gleam test  # Run the tests
```

## Git hook

To ensure built files are always up to date in the repo, add a pre-commit hook:

```sh
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
just build
git add docs/
EOF
chmod +x .git/hooks/pre-commit
```

This runs `just build` and stages the output before every commit. The commit is aborted if the build fails.
