import gleam/dict
import gleam/list
import lustre/element.{type Element}
import lustre/element/html
import model.{type BlogPost, type Message, type Model}
import pandi/lustre as pandi_lustre
import route

pub fn view(model: Model) -> Element(Message) {
  html.div([], [
    html.nav([], [
      html.h1([], [link(route.Index, "My little website")]),
      html.ul([], [
        view_menu_item(current: model.route, to: route.Posts, label: "Posts"),
        view_menu_item(current: model.route, to: route.About, label: "About"),
      ]),
    ]),
    html.main([], {
      case model.route {
        route.Index -> view_index()
        route.Posts -> view_post_list(model)
        route.PostById(post_id) -> view_post(model, post_id)
        route.About -> view_about()
        route.NotFound(_) -> view_not_found()
      }
    }),
  ])
}

fn view_menu_item(
  to target: route.Route,
  current current: route.Route,
  label text: String,
) -> Element(message) {
  let is_active = case current, target {
    route.PostById(_), route.Posts -> True
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
    Error(Nil) -> [title("Loading...")]
  }
}

fn view_post_summary(entry: #(String, BlogPost)) -> Element(message) {
  let #(id, post) = entry
  summary(
    title: post.title,
    route_to_content: route.PostById(id),
    details: post.date_created,
  )
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
          html.p([], [link(route.Posts, "<- Go back")]),
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

fn summary(
  title title: String,
  route_to_content route: route.Route,
  details text: String,
) -> Element(message) {
  html.article([], [
    html.h3([], [link(route, title)]),
    paragraph(text),
  ])
}

fn paragraph(text: String) -> Element(message) {
  html.p([], [html.text(text)])
}

fn link(target: route.Route, title: String) -> Element(message) {
  html.a([route.href(target)], [html.text(title)])
}
