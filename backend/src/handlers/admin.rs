use axum::{Router, routing::{get, post, patch, put, delete}, extract::{State, Path, Query}};
use crate::config::AppState;

pub struct AdminRouter;

impl AdminRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/organizers", get(list_organizers).post(create_organizer))
            .route("/organizers/{id}", patch(update_organizer))
            .route("/hackathons/{id}/organizers", get(list_hackathon_organizers).put(replace_organizers))
            .route("/hackathons/{id}/organizers/{org_id}", put(assign_organizer).delete(unassign_organizer))
    }
}

async fn list_organizers() -> &'static str { todo!() }
async fn create_organizer() -> &'static str { todo!() }
async fn update_organizer() -> &'static str { todo!() }
async fn list_hackathon_organizers() -> &'static str { todo!() }
async fn replace_organizers() -> &'static str { todo!() }
async fn assign_organizer() -> &'static str { todo!() }
async fn unassign_organizer() -> &'static str { todo!() }
