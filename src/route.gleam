import gleam/uri.{type Uri}
import lustre/attribute.{type Attribute}

const base_path = "/website"

pub type Route {
  Index
  Posts
  PostById(id: String)
  About
  NotFound(uri: Uri)
}

pub fn parse_route(uri: Uri) -> Route {
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

pub fn href(route: Route) -> Attribute(message) {
  let url = case route {
    Index -> base_path <> "/"
    About -> base_path <> "/about"
    Posts -> base_path <> "/posts"
    PostById(post_id) -> base_path <> "/posts/" <> post_id
    NotFound(_) -> base_path <> "/404"
  }

  attribute.href(url)
}
