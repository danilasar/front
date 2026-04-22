use axum::{Router, routing::{get, post}, extract::{State, Path}, Json, http::StatusCode};
use crate::{config::AppState, schemas::users::AuthResponse};
use crate::repositories::invitations::InvitationRepository;
use serde::{Deserialize, Serialize};

pub struct InvitationRouter;

impl InvitationRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/{token}", get(get_invitation))
            .route("/{token}/accept-existing", post(accept_existing))
            .route("/{token}/complete-registration", post(complete_registration))
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InvitationInfo {
    pub team_name: String,
    pub inviter_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteRegistrationRequest {
    pub password: String,
}

async fn get_invitation(
    State(_state): State<AppState>,
    Path(_token): Path<String>
) -> Result<Json<InvitationInfo>, StatusCode> {
    Ok(Json(InvitationInfo {
        team_name: "Super Team".to_string(),
        inviter_name: "Ivan Ivanov".to_string(),
    }))
}

async fn accept_existing() -> Result<StatusCode, StatusCode> { todo!() }

async fn complete_registration(
    State(state): State<AppState>,
    Path(token): Path<String>,
    Json(_payload): Json<CompleteRegistrationRequest>
) -> Result<Json<AuthResponse>, StatusCode> {
    let _member_id = state.invite_repo.get_by_token(&token).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    
    todo!("Завершить логику связывания аккаунта")
}
