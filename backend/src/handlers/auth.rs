use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::post,
};
use utoipa::OpenApi;

use crate::{
    AppState,
    errors::{auth::AuthError, users::UserError},
    models::tokens::Tokens,
    repositories::{is_unique_violation, users::UserRepository},
    schemas::{
        tokens::RefreshTokenRequest,
        users::{LoginUser, RegisterUser, AuthResponse, UserProfile},
    },
    services::auth::hashing::hash,
};

pub struct AuthRouter;

impl AuthRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/register", post(register))
            .route("/login", post(login))
            .route("/refresh", post(refresh))
            .route("/logout", post(logout))
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(register, login, refresh, logout),
    components(schemas(LoginUser, RegisterUser, RefreshTokenRequest, Tokens, AuthResponse, UserProfile))
)]
pub struct AuthDocs;

#[utoipa::path(
    post,
    path = "/register",
    tag = "Auth",
    request_body = RegisterUser,
    responses(
        (status = 201, description = "User registered successfully", body = AuthResponse),
        (status = 409, description = "User with this email already exists", body = String),
        (status = 500, description = "Internal database error", body = String)
    )
)]
pub async fn register(
    State(state): State<AppState>,
    Json(user_data): Json<RegisterUser>,
) -> Result<impl IntoResponse, AuthError> {
    let repo = state.user_repo.clone();
    let token_serv = state.token_serv.clone();

    match repo
        .create(repo.db_pool.clone().as_ref(), user_data.clone())
        .await
    {
        Ok(user) => {
            let tokens = token_serv.generate_tokens(&user).await?;
            let response = AuthResponse {
                user: UserProfile::from(user),
                tokens,
            };
            Ok((StatusCode::CREATED, Json(response)))
        }
        Err(e) if is_unique_violation(&e) => {
            Err(AuthError::UserError(UserError::UserAlreadyExists))
        }
        Err(e) => Err(AuthError::Db(e)),
    }
}

#[utoipa::path(
    post,
    path = "/login",
    tag = "Auth",
    request_body = LoginUser,
    responses(
        (status = 200, description = "Login successful", body = AuthResponse),
        (status = 401, description = "Invalid email or password", body = String),
        (status = 500, description = "Internal database error", body = String)
    )
)]
pub async fn login(
    State(state): State<AppState>,
    Json(user_data): Json<LoginUser>,
) -> Result<impl IntoResponse, AuthError> {
    let repo = state.user_repo.clone();
    let token_serv = state.token_serv.clone();

    match repo
        .check_login(&user_data.email, &hash(&user_data.password))
        .await?
    {
        Some(user) => {
            let tokens = token_serv.generate_tokens(&user).await?;
            let response = AuthResponse {
                user: UserProfile::from(user),
                tokens,
            };
            Ok((StatusCode::OK, Json(response)))
        }
        None => Err(AuthError::Unauthorized),
    }
}

#[utoipa::path(
    post,
    path = "/refresh",
    tag = "Auth",
    request_body = RefreshTokenRequest,
    responses(
        (status = 200, description = "Tokens refreshed successfully", body = Tokens),
        (status = 401, description = "Token is invalid or expired", body = String),
        (status = 500, description = "Internal database error", body = String)
    )
)]
pub async fn refresh(
    State(state): State<AppState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<impl IntoResponse, AuthError> {
    let token_serv = state.token_serv.clone();

    Ok((
        StatusCode::OK,
        Json(token_serv.refresh_tokens(payload.refresh_token).await?),
    ))
}

#[utoipa::path(
    post,
    path = "/logout",
    tag = "Auth",
    responses(
        (status = 204, description = "Logged out successfully")
    )
)]
pub async fn logout() -> impl IntoResponse {
    // В простейшем случае на клиенте просто удаляется токен.
    // На сервере можно добавить инвалидацию JTI в Redis, если нужно.
    StatusCode::NO_CONTENT
}
