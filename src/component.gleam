import gleam/list
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/ui/accordion
import lustre/ui/tooltip
import lustre/ui/tooltip/popover
import pandi/lustre as pl
import pandi/pandoc as pd
import route

// LAYOUT -----------------------------------------------------------------------

pub fn container(children: List(Element(message))) -> Element(message) {
  html.div([attribute.class("mx-auto max-w-6xl px-8")], children)
}

pub fn nav(children: List(Element(message))) -> Element(message) {
  html.nav([attribute.class("flex justify-between items-center my-16")], children)
}

pub fn content_area(children: List(Element(message))) -> Element(message) {
  html.main([attribute.class("my-16")], children)
}

// NAVIGATION -------------------------------------------------------------------

pub fn site_title(child: Element(message)) -> Element(message) {
  html.h1([attribute.class("text-purple-600 font-medium text-xl")], [child])
}

pub fn nav_links(children: List(Element(message))) -> Element(message) {
  html.ul([attribute.class("flex space-x-8")], children)
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
  html.li(
    [
      attribute.classes([
        #("border-transparent border-b-2 hover:border-purple-600", True),
        #("text-purple-600", is_active),
      ]),
    ],
    [inline],
  )
}

// TYPOGRAPHY --------------------------------------------------------------------

pub fn heading(title: String) -> Element(message) {
  html.h2([attribute.class("text-3xl text-purple-800 font-light")], [
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
    [route.href(target), attribute.class("text-purple-600 hover:underline cursor-pointer")],
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
    html.h3([attribute.class("text-xl text-purple-600 font-light")], [
      html.a([route.href(route), attribute.class("hover:underline")], [
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
  accordion.view([attribute.class("w-full")], [
    accordion.item(
      name: "test",
      attributes: [attribute.class("border-b border-gray-100")],
      heading: accordion.heading(
        [],
        accordion.trigger(
          [attribute.class("block w-full bg-gray-50 p-2 text-left
            hover:bg-gray-100
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800")],
          header |> list.map(pl.inline_to_lustre),
        ),
      ),
      panel: accordion.panel(
        [attribute.class("h-(--accordion-panel-height) overflow-hidden transition-[height] ease-out")],
        content |> list.map(pl.block_to_lustre),
      ),
    ),
  ])
}

// TOOLTIP -----------------------------------------------------------------------

pub fn definition(
  definition_text: String,
  content content: List(pd.Inline),
) -> Element(message) {
  tooltip.view(
    [],
    popover: tooltip.popover(
      [attribute.class(definition_popover_classes), popover.side("top")],
      [html.text(definition_text)],
    ),
    trigger: tooltip.trigger([], content |> list.map(pl.inline_to_lustre)),
  )
}

// CONSTANTS ---------------------------------------------------------------------

const definition_popover_classes = "flex flex-col px-2 py-1 rounded-md bg-black text-white text-xs shadow
  opacity-0 scale-99 [:state(open)]:opacity-100 [:state(open)]:scale-100

  [:state(top)]:left-(--tooltip-popover-x) [:state(top)]:top-[calc(var(--tooltip-popover-y)+10px)] [:state(top)]:transition-[top_opacity_transform]
  [:state(top):state(open)]:top-(--tooltip-popover-y)

  [:state(bottom)]:left-(--tooltip-popover-x) [:state(bottom)]:top-[calc(var(--tooltip-popover-y)-10px)] [:state(bottom)]:transition-[top_opacity_transform]
  [:state(bottom):state(open)]:top-(--tooltip-popover-y)

  [:state(left)]:top-(--tooltip-popover-y) [:state(left)]:left-[calc(var(--tooltip-popover-x)+10px)] [:state(left)]:transition-[left_opacity_transform]
  [:state(left):state(open)]:left-(--tooltip-popover-x)

  [:state(right)]:top-(--tooltip-popover-y) [:state(right)]:left-[calc(var(--tooltip-popover-x)-10px)] [:state(right)]:transition-[left_opacity_transform]
  [:state(right):state(open)]:left-(--tooltip-popover-x)"