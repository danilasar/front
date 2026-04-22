use axum::{Router, routing::{get, post, patch, put, delete}, extract::{State, Path, Query}};
use crate::AppState;

pub struct TeamRouter;

impl TeamRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/", get(list_teams).post(create_application))
            .route("/me", get(get_my_team))
            .route("/:team_id", get(get_team).patch(update_team).delete(delete_team))
            .route("/:team_id/status", patch(update_status))
            .route("/:team_id/members/:member_id", delete(remove_member))
            .route("/:team_id/members/:member_id/captain", put(set_captain))
            .route("/:team_id/members/:member_id/disqualify", post(disqualify_member))
    }
}

async fn list_teams() -> &'static str { todo!() }
async fn create_application() -> &'static str { todo!() }
async fn get_my_team() -> &'static str { todo!() }
async fn get_team() -> &'static str { todo!() }
async fn update_team() -> &'static str { todo!() }
async fn delete_team() -> &'static str { todo!() }
async fn update_status() -> &'static str { todo!() }
async fn remove_member() -> &'static str { todo!() }
async fn set_captain() -> &'static str { todo!() }
async fn disqualify_member() -> &'static str { todo!() }
