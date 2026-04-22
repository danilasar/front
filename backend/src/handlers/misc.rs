use axum::{Router, routing::{get, post}, extract::{State, Path}};
use crate::AppState;

pub struct MiscRouter;

impl MiscRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            // Feedback
            .route("/hackathons/:id/feedback", get(list_feedback).post(submit_feedback))
            // Files
            .route("/files", post(upload_file))
            .route("/files/:id", get(get_file))
            // Exports
            .route("/hackathons/:id/exports/teams", get(export_teams))
    }
}

async fn list_feedback() -> &'static str { todo!() }
async fn submit_feedback() -> &'static str { todo!() }
async fn upload_file() -> &'static str { todo!() }
async fn get_file() -> &'static str { todo!() }
async fn export_teams() -> &'static str { todo!() }
