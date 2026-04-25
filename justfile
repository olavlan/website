default:
    @just --list

# build the website
build:
  gleam run -m lustre/dev build

# build the website with html; run this the first time you build the website
build-with-html:
  gleam run -m lustre/dev build --no-html=false

# serve the web page locally (for development)
serve:
  gleam run -m lustre/dev start
