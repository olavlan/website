import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/json
import gleam/list
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

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

type Model {
  Model(posts: Result(Dict(String, BlogPost), Nil), route: Route)
}

type BlogPost {
  BlogPost(title: String, date_created: String, document: pd.Document)
}

type Route {
  Index
  Posts
  PostById(id: String)
  About
  NotFound(uri: Uri)
}

const base_path = "/website"

fn parse_route(uri: Uri) -> Route {
  let segments = uri.path_segments(uri.path)
  let path = case segments {
    ["website", ..rest] -> rest
    other -> other
  }
  case path {
    [] | [""] -> Index
    ["posts"] -> Posts
    ["posts", post_id] -> PostById(id: post_id)
    ["about"] -> About
    _ -> NotFound(uri:)
  }
}

fn href(route: Route) -> Attribute(message) {
  let url = case route {
    Index -> base_path <> "/"
    About -> base_path <> "/about"
    Posts -> base_path <> "/posts"
    PostById(post_id) -> base_path <> "/posts/" <> post_id
    NotFound(_) -> base_path <> "/404"
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

  #(
    Model(posts: Error(Nil), route:),
    effect.batch([modem_effect, fetch_blog()]),
  )
}

type Message {
  UserNavigatedTo(route: Route)
  BlogFetched(Result(String, rsvp.Error))
}

fn update(model: Model, message: Message) -> #(Model, Effect(Message)) {
  case message {
    UserNavigatedTo(route:) -> #(Model(..model, route:), effect.none())

    BlogFetched(Ok(body)) -> {
      let decoded =
        body
        |> json.parse(blog_posts_decoder())
      case decoded {
        Ok(posts_dict) -> #(
          Model(..model, posts: Ok(posts_dict)),
          effect.none(),
        )
        Error(_) -> #(Model(..model, posts: Error(Nil)), effect.none())
      }
    }
    BlogFetched(Error(_)) -> #(Model(..model, posts: Error(Nil)), effect.none())
  }
}

fn fetch_blog() -> Effect(Message) {
  rsvp.get(blog_url, rsvp.expect_text(BlogFetched))
}

const blog_url = "https://raw.githubusercontent.com/olavlan/blog/master/blog.json"

fn blog_posts_decoder() -> decode.Decoder(Dict(String, BlogPost)) {
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

fn view(model: Model) -> Element(Message) {
  html.div([], [
    html.nav([], [
      html.h1([], [link(Index, "My little website")]),
      html.ul([], [
        view_menu_item(current: model.route, to: Posts, label: "Posts"),
        view_menu_item(current: model.route, to: About, label: "About"),
      ]),
    ]),
    html.main([], {
      case model.route {
        Index -> view_index()
        Posts -> view_post_list(model)
        PostById(post_id) -> view_post(model, post_id)
        About -> view_about()
        NotFound(_) -> view_not_found()
      }
    }),
  ])
}

fn view_menu_item(
  to target: Route,
  current current: Route,
  label text: String,
) -> Element(message) {
  let is_active = case current, target {
    PostById(_), Posts -> True
    _, _ -> current == target
  }
  let inline = case is_active {
    True -> html.text(text)
    False -> link(target, text)
  }
  html.li([], [inline])
}

fn view_index() -> List(Element(message)) {
  [
    title("olavlan"),
    paragraph(
      "Here I post about things that interest me, which is currently functional programming, typing and Gleam.",
    ),
  ]
}

fn view_post_list(model: Model) -> List(Element(message)) {
  case model.posts {
    Ok(posts) -> {
      let entries =
        dict.to_list(posts)
        |> list.map(view_post_summary)
      [title("Posts"), ..entries]
    }
    Error(Nil) -> [title("Posts"), paragraph("Loading...")]
  }
}

fn view_post_summary(entry: #(String, BlogPost)) -> Element(message) {
  let #(id, post) = entry
  summary(post.title, PostById(id), post.date_created)
}

fn view_post(model: Model, post_id: String) -> List(Element(message)) {
  case model.posts {
    Ok(posts) ->
      case dict.get(posts, post_id) {
        Error(_) -> view_not_found()
        Ok(post) -> [
          html.article([], [
            pandi_lustre.to_lustre(post.document),
          ]),
          html.p([], [link(Posts, "<- Go back")]),
        ]
      }
    Error(Nil) -> [title("Loading...")]
  }
}

fn view_about() -> List(Element(message)) {
  [
    title("Me"),
    paragraph(
      "I'm a homely person in my thirties living in the outskirts of Oslo with my partner and cat.",
    ),
  ]
}

fn view_not_found() -> List(Element(message)) {
  [
    title("Not found"),
    paragraph("Nothing was found here."),
  ]
}

fn title(title: String) -> Element(message) {
  html.h2([], [
    html.text(title),
  ])
}

fn summary(title: String, route: Route, text: String) -> Element(message) {
  html.article([], [
    html.h3([], [link(route, title)]),
    paragraph(text),
  ])
}

fn paragraph(text: String) -> Element(message) {
  html.p([], [html.text(text)])
}

fn link(target: Route, title: String) -> Element(message) {
  html.a([href(target)], [html.text(title)])
}
