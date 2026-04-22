use axum::{Router, routing::{get, post}, extract::{State, Path}, Json, http::{HeaderMap, StatusCode}};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    config::AppState,
    repositories::{invitations::InvitationRepository, users::UserRepository},
    schemas::users::{AuthResponse, RegisterUser, UserProfile},
};

pub struct InvitationRouter;

impl InvitationRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/{token}", get(get_invitation))
            .route("/{token}/accept-existing", post(accept_existing))
            .route("/{token}/complete-registration", post(complete_registration))
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct InvitationInfo {
    pub token: String,
    pub hackathon_id: Uuid,
    pub team_id: Uuid,
    pub member_id: Uuid,
    pub full_name: String,
    pub email: Option<String>,
    pub status: String,
    pub prefilled_profile_fields: serde_json::Value,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteRegistrationRequest {
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub profile_fields: Option<serde_json::Value>,
}

async fn get_invitation(
    State(state): State<AppState>,
    Path(token): Path<String>
) -> Result<Json<InvitationInfo>, StatusCode> {
    let invitation = sqlx::query_as::<_, InvitationInfo>(
        "SELECT
            i.token,
            t.hackathon_id,
            tm.team_id,
            tm.id AS member_id,
            tm.full_name,
            tm.email,
            CASE
                WHEN i.expires_at <= NOW() THEN 'expired'
                WHEN tm.user_id IS NOT NULL OR tm.status = 'active' THEN 'accepted'
                ELSE 'pending'
            END AS status,
            COALESCE(u.profile_fields, '{}'::jsonb) AS prefilled_profile_fields,
            i.expires_at
        FROM invitations i
        JOIN team_members tm ON tm.id = i.team_member_id
        JOIN teams t ON t.id = tm.team_id
        LEFT JOIN users u ON u.id = tm.user_id
        WHERE i.token = $1"
    )
    .bind(token)
    .fetch_optional(state.invite_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(invitation))
}

async fn accept_existing(
    State(state): State<AppState>,
    Path(token): Path<String>,
    headers: HeaderMap,
) -> Result<StatusCode, StatusCode> {
    let auth_header = headers
        .get(http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;
    let (schema, access_token) = auth_header
        .split_once(' ')
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !schema.eq_ignore_ascii_case("Bearer") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let claims = state.token_serv
        .validate_access_token(access_token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let member_id = state.invite_repo.get_by_token(&token).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let user = state.user_repo.get_by_id(&claims.sub).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    sqlx::query(
        "UPDATE team_members
         SET user_id = $2, full_name = $3, email = $4, status = 'active'
         WHERE id = $1"
    )
    .bind(member_id)
    .bind(user.id)
    .bind(user.full_name)
    .bind(user.email)
    .execute(state.invite_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn complete_registration(
    State(state): State<AppState>,
    Path(token): Path<String>,
    Json(payload): Json<CompleteRegistrationRequest>
) -> Result<Json<AuthResponse>, StatusCode> {
    let member_id = state.invite_repo.get_by_token(&token).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let user = match state.user_repo.get_by_email(&payload.email).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        Some(user) => user,
        None => {
            let register = RegisterUser {
                full_name: payload.full_name.clone(),
                email: payload.email.clone(),
                password: payload.password,
            };
            state.user_repo.create(state.user_repo.db_pool.clone().as_ref(), register).await
                .map_err(|_| StatusCode::CONFLICT)?
        }
    };

    if let Some(profile_fields) = payload.profile_fields {
        sqlx::query("UPDATE users SET profile_fields = $2, updated_at = NOW() WHERE id = $1")
            .bind(user.id)
            .bind(profile_fields)
            .execute(state.user_repo.db_pool.as_ref())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    sqlx::query(
        "UPDATE team_members
         SET user_id = $2, full_name = $3, email = $4, status = 'active'
         WHERE id = $1"
    )
    .bind(member_id)
    .bind(user.id)
    .bind(payload.full_name)
    .bind(payload.email)
    .execute(state.invite_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let user = state.user_repo.get_by_id(&user.id).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

    let tokens = state.token_serv.generate_tokens(&user).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse {
        user: UserProfile::from(user),
        tokens,
    }))
}
