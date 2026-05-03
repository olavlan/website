import gleam/list
import lustre/attribute
import lustre/element.{type Element, element}
import lustre/element/html
import pandi/lustre as pl
import pandi/pandoc as pd
import route

// LAYOUT -----------------------------------------------------------------------

pub fn container(children: List(Element(message))) -> Element(message) {
  html.div([attribute.class("container mx-auto max-w-6xl px-8")], children)
}

pub fn nav(children: List(Element(message))) -> Element(message) {
  html.nav([attribute.class("navbar bg-base-100 shadow-sm my-8")], children)
}

pub fn content_area(children: List(Element(message))) -> Element(message) {
  html.main([attribute.class("my-16")], children)
}

// NAVIGATION -------------------------------------------------------------------

pub fn site_title(target: route.Route, text: String) -> Element(message) {
  html.div([attribute.class("flex-1")], [
    html.a([route.href(target), attribute.class("btn btn-ghost text-xl")], [
      html.text(text),
    ]),
  ])
}

pub fn nav_links(children: List(Element(message))) -> Element(message) {
  html.div([attribute.class("flex-none")], [
    html.ul([attribute.class("menu menu-horizontal px-1")], children),
  ])
}

pub fn nav_link(
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
  html.li([attribute.class(case is_active {
    True -> "active"
    False -> ""
  })], [inline])
}

// TYPOGRAPHY --------------------------------------------------------------------

pub fn heading(title: String) -> Element(message) {
  html.h2([attribute.class("text-3xl font-light")], [
    html.text(title),
  ])
}

pub fn leading(text: String) -> Element(message) {
  html.p([attribute.class("mt-8 text-lg")], [html.text(text)])
}

pub fn paragraph(text: String) -> Element(message) {
  html.p([attribute.class("mt-14")], [html.text(text)])
}

pub fn back_link(target: route.Route, text: String) -> Element(message) {
  html.p([attribute.class("mt-14")], [link(target, text)])
}

pub fn prose(children: List(Element(message))) -> Element(message) {
  html.article([attribute.class("prose")], children)
}

pub fn link(target: route.Route, title: String) -> Element(message) {
  html.a(
    [route.href(target), attribute.class("link hover:underline")],
    [html.text(title)],
  )
}

// POST --------------------------------------------------------------------------

pub fn post_item(
  title title_text: String,
  route_to_content route: route.Route,
  details text: String,
) -> Element(message) {
  html.article([attribute.class("mt-14")], [
    html.h3([attribute.class("text-xl font-light")], [
      html.a([route.href(route), attribute.class("link hover:underline")], [
        html.text(title_text),
      ]),
    ]),
    html.p([attribute.class("mt-1")], [html.text(text)]),
  ])
}

// ACCORDION ---------------------------------------------------------------------

pub fn expandable_box(
  header header: List(pd.Inline),
  content content: List(pd.Block),
) -> Element(message) {
  element(
    "details",
    [attribute.class("collapse collapse-arrow bg-base-100 border border-base-300")],
    [
      element(
        "summary",
        [attribute.class("collapse-title font-semibold")],
        header |> list.map(pl.inline_to_lustre),
      ),
      html.div(
        [attribute.class("collapse-content")],
        content |> list.map(pl.block_to_lustre),
      ),
    ],
  )
}

// TOOLTIP -----------------------------------------------------------------------

pub fn definition(
  definition_text: String,
  content content: List(pd.Inline),
) -> Element(message) {
  html.div(
    [
      attribute.class("tooltip tooltip-top"),
      attribute.attribute("data-tip", definition_text),
    ],
    content |> list.map(pl.inline_to_lustre),
  )
}