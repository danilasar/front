use axum::{
    Extension, Json, Router,
    extract::State,
    http::StatusCode,
    middleware::from_fn,
    response::IntoResponse,
    routing::{get, patch},
};
use utoipa::OpenApi;

use crate::{
    AppState,
    errors::users::UserError,
    middlewares::{auth::auth_middleware, role::role_middleware},
    models::users::{Role, User},
    repositories::{
        users::UserRepository,
    },
    schemas::users::{UserProfile, RegisterUser},
    services::auth::tokens::Claims,
};

pub struct UserRouter;

impl UserRouter {
    pub fn set_router(state: AppState) -> Router<AppState> {
        Router::new()
            .route("/me", get(me))
            .route("/me", patch(update_me))
            .route_layer(from_fn(move |req, next| async move {
                role_middleware(req, next, Role::all()).await
            }))
            .route_layer({
                let token_serv = state.token_serv.clone();
                from_fn(move |req, next| {
                    let token_serv = token_serv.clone();
                    async move { auth_middleware(req, next, token_serv.clone()).await }
                })
            })
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(me, update_me),
    components(schemas(UserProfile, RegisterUser))
)]
pub struct UserDocs;

#[utoipa::path(
    get,
    tag = "Users",
    security(
        ("bearer_auth" = [])
    ),
    path = "/me",
    responses(
        (status = 200, description = "Current user profile", body = UserProfile),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found", body = String),
        (status = 500, description = "Internal database error", body = String)
    )
)]
pub async fn me(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, UserError> {
    let repo = state.user_repo.clone();
    match repo.get_by_id(&claims.sub).await? {
        Some(user) => Ok((StatusCode::OK, Json(UserProfile::from(user)))),
        None => Err(UserError::NotFound),
    }
}

#[utoipa::path(
    patch,
    tag = "Users",
    security(
        ("bearer_auth" = [])
    ),
    path = "/me",
    responses(
        (status = 200, description = "Profile updated", body = UserProfile),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal database error", body = String)
    )
)]
pub async fn update_me(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
    Json(payload): Json<RegisterUser>,
) -> Result<impl IntoResponse, UserError> {
    let repo = state.user_repo.clone();
    let mut user = User::from(payload);
    user.id = claims.sub;
    user.role = Role::from(claims.role);

    repo.update(repo.db_pool.clone().as_ref(), user.clone()).await?;
    
    Ok((StatusCode::OK, Json(UserProfile::from(user))))
}
