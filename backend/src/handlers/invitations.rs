use axum::{Router, routing::{get, post}, extract::{State, Path}};
use crate::AppState;

pub struct InvitationRouter;

impl InvitationRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/:token", get(get_invitation))
            .route("/:token/accept-existing", post(accept_existing))
            .route("/:token/complete-registration", post(complete_registration))
    }
}

async fn get_invitation() -> &'static str { todo!() }
async fn accept_existing() -> &'static str { todo!() }
async fn complete_registration() -> &'static str { todo!() }
