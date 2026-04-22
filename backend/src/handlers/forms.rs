use axum::{Router, routing::{get, post, patch, delete}, extract::{State, Path}};
use crate::config::AppState;

pub struct FormRouter;

impl FormRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/", get(list_fields).post(create_field))
            .route("/{field_id}", patch(update_field).delete(delete_field))
    }
}

async fn list_fields() -> &'static str { todo!() }
async fn create_field() -> &'static str { todo!() }
async fn update_field() -> &'static str { todo!() }
async fn delete_field() -> &'static str { todo!() }
