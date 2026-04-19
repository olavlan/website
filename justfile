default:
    @just --list

# build the website
build:
  gleam run -m lustre/dev build

# serve the web page locally (for development)
serve:
  gleam run -m lustre/dev start
