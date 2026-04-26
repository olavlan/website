import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import pandi
import pandi/lustre as pandi_lustre
import pandi/pandoc as pd
import rsvp

const index_url = "https://raw.githubusercontent.com/olavlan/blog/master/index.json"

pub type BlogEntry {
  BlogEntry(title: String, url: String, date_created: String)
}

pub type Model {
  Model(
    entries: Option(Result(List(BlogEntry), Nil)),
    post: Option(Result(pd.Document, Nil)),
  )
}

pub type Msg {
  IndexFetched(Result(String, rsvp.Error))
  UserClickedBlogPost(url: String)
  BlogPostFetched(Result(String, rsvp.Error))
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

fn init(_flags) -> #(Model, Effect(Msg)) {
  #(Model(entries: None, post: None), fetch_index())
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

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    IndexFetched(Ok(body)) -> {
      case json.parse(from: body, using: decode.list(entry_decoder())) {
        Ok(entries) -> #(
          Model(..model, entries: Some(Ok(entries))),
          effect.none(),
        )
        Error(_) -> #(Model(..model, entries: Some(Error(Nil))), effect.none())
      }
    }
    IndexFetched(Error(_)) -> #(
      Model(..model, entries: Some(Error(Nil))),
      effect.none(),
    )

    UserClickedBlogPost(url) -> #(
      Model(..model, post: None),
      fetch_blog_post(url),
    )

    BlogPostFetched(Ok(body)) -> {
      echo body
      case pandi.from_json(body) {
        Ok(doc) -> #(Model(..model, post: Some(Ok(doc))), effect.none())
        Error(_) -> #(Model(..model, post: Some(Error(Nil))), effect.none())
      }
    }
    BlogPostFetched(Error(_)) -> #(
      Model(..model, post: Some(Error(Nil))),
      effect.none(),
    )
  }
}

fn view(model: Model) -> Element(Msg) {
  case model.entries {
    None -> html.text("Loading...")
    Some(Ok(entries)) -> view_entries(entries, model.post)
    Some(Error(Nil)) -> html.text("Failed to fetch blog index.")
  }
}

fn view_entries(
  entries: List(BlogEntry),
  post: Option(Result(pd.Document, Nil)),
) -> Element(Msg) {
  let entry_list =
    html.ul(
      [],
      list.map(entries, fn(entry) {
        html.li([], [
          html.button([event.on_click(UserClickedBlogPost(entry.url))], [
            html.text(entry.title),
          ]),
        ])
      }),
    )

  let block_renderer: pandi_lustre.BlockRenderer(Msg) = fn(block, _) {
    case block {
      pd.Para([pd.Str("http" <> rest)]) ->
        Some(html.link([attribute.href(rest)]))
      _ -> None
    }
  }
  let inline_renderer: pandi_lustre.InlineRenderer(Msg) = fn(inline, _) {
    case inline {
      pd.Space -> Some(html.text("-"))
      _ -> None
    }
  }
  let post_view = case post {
    None -> html.text("")
    Some(Ok(doc)) ->
      pandi_lustre.to_lustre_with(doc, block_renderer, inline_renderer)
    Some(Error(Nil)) -> html.text("Failed to fetch blog post.")
  }
  html.div([], [entry_list, post_view])
}
