import component
import gleam/dict
import gleam/list
import gleam/option.{None, Some}
import lustre/element.{type Element}
import model.{type BlogPost, type Message, type Model}
import pandi/lustre as pl
import pandi/pandoc as pd
import route

pub fn view(model: Model) -> Element(Message) {
  component.container([
    component.nav([
      component.site_title(route.Index, "My little website"),
      component.nav_links([
        component.nav_link(
          to: route.Posts,
          current: model.route,
          label: "Posts",
        ),
        component.nav_link(
          to: route.About,
          current: model.route,
          label: "About",
        ),
      ]),
    ]),
    component.content_area({
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

fn view_index() -> List(Element(message)) {
  [
    component.heading("olavlan"),
    component.leading(
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
      [component.heading("Posts"), ..entries]
    }
    Error(Nil) -> [component.heading("Loading...")]
  }
}

fn view_post_summary(entry: #(String, BlogPost)) -> Element(message) {
  let #(id, post) = entry
  component.post_item(
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
          component.prose([
            pl.to_lustre_with(
              post.document,
              block_renderer(),
              inline_renderer(),
            ),
          ]),
          component.back_link(route.Posts, "<- Go back"),
        ]
      }
    Error(Nil) -> [component.heading("Loading...")]
  }
}

fn block_renderer() -> pl.BlockRenderer(message) {
  fn(block, _) {
    case block {
      pd.Div(_, [pd.Header(1, _, inlines), ..rest]) ->
        Some(component.expandable_box(inlines, rest))
      _ -> None
    }
  }
}

fn inline_renderer() -> pl.InlineRenderer(message) {
  fn(inline, _) {
    case inline {
      pd.Span(pd.Attributes(_, _, [#("definition", definition_text)]), content) ->
        Some(component.definition(definition_text, content))
      _ -> None
    }
  }
}

fn view_about() -> List(Element(message)) {
  [
    component.heading("Me"),
    component.paragraph(
      "I'm a homely person in my thirties living in the outskirts of Oslo with my partner and cat.",
    ),
  ]
}

fn view_not_found() -> List(Element(message)) {
  [
    component.heading("Not found"),
    component.paragraph("Nothing was found here."),
  ]
}
