// IMPORTS ---------------------------------------------------------------------

import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/uri.{type Uri}
import lustre
import lustre/attribute.{type Attribute}
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import modem
import pandi/decode as pandi_decode
import pandi/lustre as pandi_lustre
import pandi/pandoc as pd
import rsvp

// MAIN ------------------------------------------------------------------------

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

// MODEL -----------------------------------------------------------------------

type Model {
  Model(posts: Option(Result(Dict(Int, BlogPost), Nil)), route: Route)
}

type BlogPost {
  BlogPost(title: String, date_created: String, document: pd.Document)
}

type Route {
  Index
  Posts
  PostById(id: Int)
  About
  NotFound(uri: Uri)
}

fn parse_route(uri: Uri) -> Route {
  case uri.path_segments(uri.path) {
    [] | [""] -> Index

    ["posts"] -> Posts

    ["post", post_id] ->
      case int.parse(post_id) {
        Ok(post_id) -> PostById(id: post_id)
        Error(_) -> NotFound(uri:)
      }

    ["about"] -> About

    _ -> NotFound(uri:)
  }
}

fn href(route: Route) -> Attribute(message) {
  let url = case route {
    Index -> "/"
    About -> "/about"
    Posts -> "/posts"
    PostById(post_id) -> "/post/" <> int.to_string(post_id)
    NotFound(_) -> "/404"
  }

  attribute.href(url)
}

fn init(_) -> #(Model, Effect(Message)) {
  let route = case modem.initial_uri() {
    Ok(uri) -> parse_route(uri)
    Error(_) -> Index
  }

  let modem_effect =
    modem.init(fn(uri) {
      uri
      |> parse_route
      |> UserNavigatedTo
    })

  let effects = case route {
    Posts -> effect.batch([modem_effect, fetch_blog()])
    PostById(_) -> effect.batch([modem_effect, fetch_blog()])
    _ -> modem_effect
  }

  #(Model(posts: None, route:), effects)
}

// UPDATE ----------------------------------------------------------------------

type Message {
  UserNavigatedTo(route: Route)
  BlogFetched(Result(String, rsvp.Error))
}

fn update(model: Model, message: Message) -> #(Model, Effect(Message)) {
  case message {
    UserNavigatedTo(route:) -> {
      let effect = case route, model.posts {
        Posts, None -> fetch_blog()
        PostById(_), None -> fetch_blog()
        _, _ -> effect.none()
      }
      #(Model(..model, route:), effect)
    }

    BlogFetched(Ok(body)) -> {
      let decoded =
        body
        |> json.parse(blog_posts_decoder())
        |> result.map(fn(posts) {
          posts
          |> list.index_map(fn(post, index) { #(index, post) })
          |> dict.from_list
        })
      case decoded {
        Ok(posts_dict) -> #(
          Model(..model, posts: Some(Ok(posts_dict))),
          effect.none(),
        )
        Error(_) -> #(Model(..model, posts: Some(Error(Nil))), effect.none())
      }
    }
    BlogFetched(Error(_)) -> #(
      Model(..model, posts: Some(Error(Nil))),
      effect.none(),
    )
  }
}

fn fetch_blog() -> Effect(Message) {
  rsvp.get(blog_url, rsvp.expect_text(BlogFetched))
}

const blog_url = "https://raw.githubusercontent.com/olavlan/blog/master/blog.json"

// DECODERS --------------------------------------------------------------------

fn blog_posts_decoder() -> decode.Decoder(List(BlogPost)) {
  use posts <- decode.field("posts", decode.list(blog_post_decoder()))
  decode.success(posts)
}

fn blog_post_decoder() -> decode.Decoder(BlogPost) {
  use title <- decode.field("title", decode.string)
  use date_created <- decode.field("date_created", decode.string)
  use document <- decode.field("pandoc", pandi_decode.document_decoder())
  decode.success(BlogPost(title:, date_created:, document:))
}

// VIEW ------------------------------------------------------------------------

fn view(model: Model) -> Element(Message) {
  html.div([attribute.class("mx-auto max-w-2xl px-32")], [
    html.nav([attribute.class("flex justify-between items-center my-16")], [
      html.h1([attribute.class("text-purple-600 font-medium text-xl")], [
        html.a([href(Index)], [html.text("My little Blog")]),
      ]),
      html.ul([attribute.class("flex space-x-8")], [
        view_header_link(current: model.route, to: Posts, label: "Posts"),
        view_header_link(current: model.route, to: About, label: "About"),
      ]),
    ]),
    html.main([attribute.class("my-16")], {
      case model.route {
        Index -> view_index()
        Posts -> view_posts(model)
        PostById(post_id) -> view_post(model, post_id)
        About -> view_about()
        NotFound(_) -> view_not_found()
      }
    }),
  ])
}

fn view_header_link(
  to target: Route,
  current current: Route,
  label text: String,
) -> Element(message) {
  let is_active = case current, target {
    PostById(_), Posts -> True
    _, _ -> current == target
  }

  html.li(
    [
      attribute.classes([
        #("border-transparent border-b-2 hover:border-purple-600", True),
        #("text-purple-600", is_active),
      ]),
    ],
    [html.a([href(target)], [html.text(text)])],
  )
}

// VIEW PAGES ------------------------------------------------------------------

fn view_index() -> List(Element(message)) {
  [
    title("Hello, Joe"),
    leading(
      "Or whoever you may be! This is were I will share random ramblings
       and thoughts about life.",
    ),
    html.p([attribute.class("mt-14")], [
      html.text("There is not much going on at the moment, but you can still "),
      link(Posts, "read my ramblings ->"),
    ]),
    paragraph("If you like <3"),
  ]
}

fn view_posts(model: Model) -> List(Element(Message)) {
  case model.posts {
    None -> [title("Posts"), leading("Loading...")]
    Some(Error(Nil)) -> [title("Posts"), leading("Failed to fetch posts.")]
    Some(Ok(posts)) -> {
      let entries =
        posts
        |> dict.to_list
        |> list.sort(fn(a, b) { int.compare(a.0, b.0) })
        |> list.map(fn(entry) {
          let index = entry.0
          let post = entry.1
          html.article([attribute.class("mt-14")], [
            html.h3([attribute.class("text-xl text-purple-600 font-light")], [
              html.a(
                [attribute.class("hover:underline"), href(PostById(index))],
                [html.text(post.title)],
              ),
            ]),
            html.p([attribute.class("mt-1")], [
              html.text(post.date_created),
            ]),
          ])
        })

      [title("Posts"), ..entries]
    }
  }
}

fn view_post(model: Model, post_id: Int) -> List(Element(Message)) {
  case model.posts {
    None -> [title("Loading...")]
    Some(Error(Nil)) -> [title("Failed to fetch posts.")]
    Some(Ok(posts)) ->
      case dict.get(posts, post_id) {
        Error(_) -> view_not_found()
        Ok(post) -> [
          html.article([], [
            pandi_lustre.to_lustre(post.document),
          ]),
          html.p([attribute.class("mt-14")], [link(Posts, "<- Go back?")]),
        ]
      }
  }
}

fn view_about() -> List(Element(message)) {
  [
    title("Me"),
    paragraph(
      "I document the odd occurrences that catch my attention and rewrite my own
       narrative along the way. I'm fine being referred to with pronouns.",
    ),
    paragraph(
      "If you enjoy these glimpses into my mind, feel free to come back
       semi-regularly. But not too regularly, you creep.",
    ),
  ]
}

fn view_not_found() -> List(Element(message)) {
  [
    title("Not found"),
    paragraph(
      "You glimpse into the void and see -- nothing?
       Well that was somewhat expected.",
    ),
  ]
}

// VIEW HELPERS ----------------------------------------------------------------

fn title(title: String) -> Element(message) {
  html.h2([attribute.class("text-3xl text-purple-800 font-light")], [
    html.text(title),
  ])
}

fn leading(text: String) -> Element(message) {
  html.p([attribute.class("mt-8 text-lg")], [html.text(text)])
}

fn paragraph(text: String) -> Element(message) {
  html.p([attribute.class("mt-14")], [html.text(text)])
}

fn link(target: Route, title: String) -> Element(message) {
  html.a(
    [
      href(target),
      attribute.class("text-purple-600 hover:underline cursor-pointer"),
    ],
    [html.text(title)],
  )
}
