import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/json
import lustre/effect.{type Effect}
import modem
import pandi/decode as pandi_decode
import pandi/pandoc as pd
import route
import rsvp

pub type Model {
  Model(posts: Result(Dict(String, BlogPost), Nil), route: route.Route)
}

pub type Message {
  UserNavigatedTo(route: route.Route)
  BlogFetched(Result(String, rsvp.Error))
}

pub type BlogPost {
  BlogPost(title: String, date_created: String, document: pd.Document)
}

pub fn init(_) -> #(Model, Effect(Message)) {
  let route = case modem.initial_uri() {
    Ok(uri) -> route.parse_route(uri)
    Error(_) -> route.Index
  }

  let modem_effect =
    modem.init(fn(uri) { route.parse_route(uri) |> UserNavigatedTo })

  #(
    Model(posts: Error(Nil), route:),
    effect.batch([modem_effect, fetch_blog()]),
  )
}

pub fn update(model: Model, message: Message) -> #(Model, Effect(Message)) {
  case message {
    UserNavigatedTo(route:) -> #(Model(..model, route:), effect.none())

    BlogFetched(Ok(body)) -> {
      let decoded =
        body
        |> json.parse(blog_decoder())
      case decoded {
        Ok(posts) -> #(Model(..model, posts: Ok(posts)), effect.none())
        Error(_) -> #(Model(..model, posts: Error(Nil)), effect.none())
      }
    }

    BlogFetched(Error(_)) -> #(Model(..model, posts: Error(Nil)), effect.none())
  }
}

const blog_url = "https://raw.githubusercontent.com/olavlan/blog/master/blog.json"

fn fetch_blog() -> Effect(Message) {
  rsvp.get(blog_url, rsvp.expect_text(BlogFetched))
}

fn blog_decoder() -> decode.Decoder(Dict(String, BlogPost)) {
  use posts <- decode.field(
    "posts",
    decode.dict(decode.string, blog_post_decoder()),
  )
  decode.success(posts)
}

fn blog_post_decoder() -> decode.Decoder(BlogPost) {
  use title <- decode.field("title", decode.string)
  use date_created <- decode.field("date_created", decode.string)
  use document <- decode.field("pandoc", pandi_decode.document_decoder())
  decode.success(BlogPost(title:, date_created:, document:))
}
