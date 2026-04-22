use axum::{
    Json, Router,
    extract::{Path, State, Multipart},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, patch, delete, put},
};
use serde::Serialize;
use utoipa::OpenApi;
use uuid::Uuid;

use crate::{
    config::AppState,
    models::hackathons::Hackathon,
    repositories::hackathons::HackathonRepository,
    schemas::hackathons::{CreateHackathonRequest, FileAsset, HackathonResponse},
};

pub struct HackathonRouter;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Page<T> {
    page: u32,
    page_size: u32,
    total: usize,
    items: Vec<T>,
}

async fn organizer_ids_for(state: &AppState, hackathon_id: Uuid) -> Result<Vec<Uuid>, StatusCode> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT user_id FROM hackathon_organizers WHERE hackathon_id = $1 ORDER BY user_id"
    )
    .bind(hackathon_id)
    .fetch_all(state.hackathon_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn hackathon_response(state: &AppState, hackathon: Hackathon) -> Result<HackathonResponse, StatusCode> {
    let mut response = HackathonResponse::from(hackathon);
    response.organizer_ids = organizer_ids_for(state, response.id).await?;
    Ok(response)
}

async fn hackathon_responses(state: &AppState, hackathons: Vec<Hackathon>) -> Result<Vec<HackathonResponse>, StatusCode> {
    let mut responses = Vec::with_capacity(hackathons.len());
    for hackathon in hackathons {
        responses.push(hackathon_response(state, hackathon).await?);
    }
    Ok(responses)
}

impl HackathonRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/", get(list_hackathons))
            .route("/", post(create_hackathon))
            .route("/active", get(get_active_hackathon))
            .route("/{id}", get(get_hackathon))
            .route("/{id}", patch(update_hackathon))
            .route("/{id}", delete(delete_hackathon))
            .route("/{id}/activate", post(activate_hackathon))
            .route("/{id}/rules", put(upload_rules))
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(list_hackathons, create_hackathon, get_active_hackathon, get_hackathon, update_hackathon, delete_hackathon, activate_hackathon, upload_rules),
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
        Ok(h) => {
            let items = hackathon_responses(&state, h).await?;
            Ok(Json(Page {
                page: 1,
                page_size: items.len() as u32,
                total: items.len(),
                items,
            }))
        }
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
        Ok(h) => Ok((StatusCode::CREATED, Json(hackathon_response(&state, h).await?))),
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
        Ok(Some(h)) => Ok(Json(hackathon_response(&state, h).await?)),
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
        Ok(Some(h)) => Ok(Json(hackathon_response(&state, h).await?)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    patch,
    tag = "Hackathons",
    path = "/{id}",
    responses(
        (status = 200, description = "Hackathon updated", body = HackathonResponse),
        (status = 404, description = "Hackathon not found")
    )
)]
pub async fn update_hackathon(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    if let Some(title) = payload.get("title").and_then(|value| value.as_str()) {
        sqlx::query("UPDATE hackathons SET title = $2, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .bind(title)
            .execute(state.hackathon_repo.db_pool.as_ref())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    if let Some(description) = payload.get("description") {
        sqlx::query("UPDATE hackathons SET description = $2, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .bind(description.as_str())
            .execute(state.hackathon_repo.db_pool.as_ref())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    match state.hackathon_repo.get_by_id(&id).await {
        Ok(Some(h)) => Ok(Json(hackathon_response(&state, h).await?)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    delete,
    tag = "Hackathons",
    path = "/{id}",
    responses(
        (status = 204, description = "Hackathon deleted")
    )
)]
pub async fn delete_hackathon(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query("DELETE FROM hackathons WHERE id = $1")
        .bind(id)
        .execute(state.hackathon_repo.db_pool.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    post,
    tag = "Hackathons",
    path = "/{id}/activate",
    params(
        ("id" = Uuid, Path, description = "Hackathon ID")
    ),
    responses(
        (status = 200, description = "Hackathon activated", body = HackathonResponse),
        (status = 404, description = "Hackathon not found")
    )
)]
pub async fn activate_hackathon(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let repo = state.hackathon_repo.clone();
    match repo.activate(&id).await {
        Ok(_) => {
            if let Ok(Some(h)) = repo.get_by_id(&id).await {
                Ok((StatusCode::OK, Json(hackathon_response(&state, h).await?)))
            } else {
                Err(StatusCode::INTERNAL_SERVER_ERROR)
            }
        },
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[utoipa::path(
    put,
    tag = "Hackathons",
    path = "/{id}/rules",
    responses(
        (status = 200, description = "Rules uploaded", body = FileAsset)
    )
)]
pub async fn upload_rules(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, StatusCode> {
    while let Ok(Some(field)) = multipart.next_field().await {
        if let Some("file") = field.name() {
             let file_id = Uuid::new_v4();
             sqlx::query("UPDATE hackathons SET rules_file_id = $1 WHERE id = $2")
                .bind(file_id)
                .bind(id)
                .execute(state.hackathon_repo.db_pool.as_ref())
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

             return match state.hackathon_repo.get_by_id(&id).await {
                 Ok(Some(h)) => Ok(Json(hackathon_response(&state, h).await?)),
                 Ok(None) => Err(StatusCode::NOT_FOUND),
                 Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
             };
        }
    }
    Err(StatusCode::BAD_REQUEST)
}
