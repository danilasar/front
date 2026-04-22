use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use utoipa::OpenApi;
use uuid::Uuid;

use crate::{
    AppState,
    repositories::hackathons::HackathonRepository,
    schemas::hackathons::{HackathonResponse, CreateHackathonRequest},
};

pub struct HackathonRouter;

impl HackathonRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/", get(list_hackathons))
            .route("/", post(create_hackathon))
            .route("/active", get(get_active_hackathon))
            .route("/{id}", get(get_hackathon))
            .route("/{id}/activate", post(activate_hackathon))
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(list_hackathons, create_hackathon, get_active_hackathon, get_hackathon, activate_hackathon),
    components(schemas(HackathonResponse, CreateHackathonRequest))
)]
pub struct HackathonDocs;

#[utoipa::path(
    get,
    tag = "Hackathons",
    path = "",
    responses(
        (status = 200, description = "List of hackathons", body = Vec<HackathonResponse>),
        (status = 500, description = "Internal database error", body = String)
    )
)]
pub async fn list_hackathons(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let repo = state.hackathon_repo.clone();
    match repo.get_all().await {
        Ok(h) => Ok(Json(h.into_iter().map(HackathonResponse::from).collect::<Vec<_>>())),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    post,
    tag = "Hackathons",
    path = "",
    request_body = CreateHackathonRequest,
    responses(
        (status = 201, description = "Hackathon created", body = HackathonResponse),
        (status = 500, description = "Internal database error", body = String)
    )
)]
pub async fn create_hackathon(
    State(state): State<AppState>,
    Json(payload): Json<CreateHackathonRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let repo = state.hackathon_repo.clone();
    match repo.create(repo.db_pool.clone().as_ref(), payload).await {
        Ok(h) => Ok((StatusCode::CREATED, Json(HackathonResponse::from(h)))),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    get,
    tag = "Hackathons",
    path = "/active",
    responses(
        (status = 200, description = "Active hackathon", body = HackathonResponse),
        (status = 404, description = "No active hackathon found")
    )
)]
pub async fn get_active_hackathon(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let repo = state.hackathon_repo.clone();
    match repo.get_active().await {
        Ok(Some(h)) => Ok(Json(HackathonResponse::from(h))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    get,
    tag = "Hackathons",
    path = "/{id}",
    params(
        ("id" = Uuid, Path, description = "Hackathon ID")
    ),
    responses(
        (status = 200, description = "Hackathon details", body = HackathonResponse),
        (status = 404, description = "Hackathon not found")
    )
)]
pub async fn get_hackathon(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let repo = state.hackathon_repo.clone();
    match repo.get_by_id(&id).await {
        Ok(Some(h)) => Ok(Json(HackathonResponse::from(h))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    post,
    tag = "Hackathons",
    path = "/{id}/activate",
    params(
        ("id" = Uuid, Path, description = "Hackathon ID")
    ),
    responses(
        (status = 204, description = "Hackathon activated"),
        (status = 404, description = "Hackathon not found")
    )
)]
pub async fn activate_hackathon(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let repo = state.hackathon_repo.clone();
    match repo.activate(&id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
