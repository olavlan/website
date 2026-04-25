import gleam/dynamic/decode
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{None, Some}

import gleam/uri.{type Uri}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import modem
import pandi
import pandi/lustre as pandi_lustre
import pandi/pandoc as pd
import rsvp

const index_url = "https://raw.githubusercontent.com/olavlan/blog/master/index.json"

pub type BlogEntry {
  BlogEntry(title: String, url: String, date_created: String)
}

pub type Route {
  Index
  Post(n: Int)
  NotFound
}

pub type Model {
  Model(
    entries: Result(List(BlogEntry), Nil),
    post: Result(pd.Document, Nil),
    route: Route,
  )
}

pub type Msg {
  UserNavigatedTo(route: Route)
  IndexFetched(Result(String, rsvp.Error))
  BlogPostFetched(Result(String, rsvp.Error))
}

fn parse_route(uri: Uri) -> Route {
  case uri.path_segments(uri.path) {
    [] | [""] -> Index
    ["posts", n] ->
      case int.parse(n) {
        Ok(n) -> Post(n)
        Error(_) -> NotFound
      }
    _ -> NotFound
  }
}

fn route_to_href(route: Route) -> String {
  case route {
    Index -> "/"
    Post(n) -> "/posts/" <> int.to_string(n)
    NotFound -> "/404"
  }
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

fn init(_flags) -> #(Model, Effect(Msg)) {
  let route = case modem.initial_uri() {
    Ok(uri) -> parse_route(uri)
    Error(_) -> Index
  }
  let model = Model(entries: Error(Nil), post: Error(Nil), route:)
  let effect =
    effect.batch([
      fetch_index(),
      modem.init(fn(uri) { uri |> parse_route |> UserNavigatedTo }),
    ])
  #(model, effect)
}

fn fetch_index() -> Effect(Msg) {
  rsvp.get(index_url, rsvp.expect_text(IndexFetched))
}

fn fetch_blog_post(url: String) -> Effect(Msg) {
  rsvp.get(url, rsvp.expect_text(BlogPostFetched))
}

fn entry_decoder() -> decode.Decoder(BlogEntry) {
  use title <- decode.field("title", decode.string)
  use url <- decode.field("url", decode.string)
  use date_created <- decode.field("date_created", decode.string)
  decode.success(BlogEntry(title:, url:, date_created:))
}

fn get_post_url(entries: List(BlogEntry), n: Int) -> Result(String, Nil) {
  let target = n - 1
  entries
  |> list.index_fold(Error(Nil), fn(acc, entry, i) {
    case acc, i == target {
      Ok(url), _ -> Ok(url)
      Error(Nil), True -> Ok(entry.url)
      Error(Nil), False -> Error(Nil)
    }
  })
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    UserNavigatedTo(route) -> #(
      Model(..model, route:, post: Error(Nil)),
      case route {
        Post(n) -> fetch_post_for_route(model.entries, n)
        _ -> effect.none()
      },
    )

    IndexFetched(Ok(body)) -> {
      case json.parse(from: body, using: decode.list(entry_decoder())) {
        Ok(entries) -> #(
          Model(..model, entries: Ok(entries)),
          case model.route {
            Post(n) -> fetch_post_for_route(Ok(entries), n)
            _ -> effect.none()
          },
        )
        Error(_) -> #(Model(..model, entries: Error(Nil)), effect.none())
      }
    }
    IndexFetched(Error(_)) -> #(
      Model(..model, entries: Error(Nil)),
      effect.none(),
    )

    BlogPostFetched(Ok(body)) -> {
      case pandi.from_json(body) {
        Ok(doc) -> #(Model(..model, post: Ok(doc)), effect.none())
        Error(_) -> #(Model(..model, post: Error(Nil)), effect.none())
      }
    }
    BlogPostFetched(Error(_)) -> #(
      Model(..model, post: Error(Nil)),
      effect.none(),
    )
  }
}

fn fetch_post_for_route(
  entries: Result(List(BlogEntry), Nil),
  n: Int,
) -> Effect(Msg) {
  case entries {
    Ok(entries) ->
      case get_post_url(entries, n) {
        Ok(url) -> fetch_blog_post(url)
        Error(Nil) -> effect.none()
      }
    Error(Nil) -> effect.none()
  }
}

fn view(model: Model) -> Element(Msg) {
  html.div([], [
    view_menu(model.entries),
    view_content(model),
  ])
}

fn view_menu(entries: Result(List(BlogEntry), Nil)) -> Element(Msg) {
  let content = case entries {
    Ok(entries) -> view_index(entries)
    Error(Nil) -> html.text("Loading...")
  }
  html.aside([], [content])
}

fn view_index(entries: List(BlogEntry)) -> Element(Msg) {
  let items =
    list.index_map(entries, fn(entry, i) {
      let n = i + 1
      html.li([], [
        html.a([attribute.href(route_to_href(Post(n)))], [
          html.text(entry.title),
        ]),
      ])
    })
  html.ul([], items)
}

fn view_content(model: Model) -> Element(Msg) {
  case model.route {
    Index -> html.text("")
    Post(_) -> view_post(model.post)
    NotFound -> html.text("Not found")
  }
}

fn view_post(post: Result(pd.Document, Nil)) -> Element(Msg) {
  let block_renderer: pandi_lustre.BlockRenderer(Msg) = fn(block, _) {
    case block {
      pd.Para([pd.Str("youtube:" <> video_id)]) ->
        Some(html.link([attribute.href(video_id)]))
      _ -> None
    }
  }
  let inline_renderer: pandi_lustre.InlineRenderer(Msg) = fn(inline, _) {
    case inline {
      pd.Space -> Some(html.text("-"))
      _ -> None
    }
  }
  case post {
    Ok(doc) -> pandi_lustre.to_lustre_with(doc, block_renderer, inline_renderer)
    Error(Nil) -> html.text("")
  }
}
