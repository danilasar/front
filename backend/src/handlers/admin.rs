use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, patch, put},
    Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

use crate::{
    config::AppState,
    models::users::Role,
    repositories::{is_unique_violation, users::UserRepository},
    schemas::users::{RegisterUser, UserProfile},
};

pub struct AdminRouter;

impl AdminRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/organizers", get(list_organizers).post(create_organizer))
            .route("/organizers/{id}", patch(update_organizer))
            .route(
                "/hackathons/{id}/organizers",
                get(list_hackathon_organizers).put(replace_organizers),
            )
            .route(
                "/hackathons/{id}/organizers/{org_id}",
                put(assign_organizer).delete(unassign_organizer),
            )
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Page<T> {
    page: u32,
    page_size: u32,
    total: usize,
    items: Vec<T>,
}

async fn list_organizers(State(state): State<AppState>) -> Result<impl IntoResponse, StatusCode> {
    let users = state
        .user_repo
        .get(&crate::repositories::users::Offset(0), &crate::repositories::users::Limit(100))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let items = users
        .into_iter()
        .filter(|user| user.role == Role::Organizer || user.role == Role::Admin)
        .map(UserProfile::from)
        .collect::<Vec<_>>();

    Ok(Json(Page {
        page: 1,
        page_size: items.len() as u32,
        total: items.len(),
        items,
    }))
}

async fn create_organizer(
    State(state): State<AppState>,
    Json(payload): Json<RegisterUser>,
) -> Result<impl IntoResponse, StatusCode> {
    match state
        .user_repo
        .create_admin(state.user_repo.db_pool.as_ref(), payload)
        .await
    {
        Ok(user) => Ok((StatusCode::CREATED, Json(UserProfile::from(user)))),
        Err(error) if is_unique_violation(&error) => Err(StatusCode::CONFLICT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_organizer(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    let mut user = state
        .user_repo
        .get_by_id(&id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if let Some(full_name) = payload.get("fullName").and_then(|value| value.as_str()) {
        user.full_name = full_name.to_string();
    }
    if let Some(email) = payload.get("email").and_then(|value| value.as_str()) {
        user.email = email.to_string();
    }

    state
        .user_repo
        .update(state.user_repo.db_pool.as_ref(), user.clone())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(UserProfile::from(user)))
}

async fn list_hackathon_organizers(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let rows = sqlx::query_as::<_, (Uuid,)>(
        "SELECT user_id FROM hackathon_organizers WHERE hackathon_id = $1",
    )
    .bind(id)
    .fetch_all(state.user_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows.into_iter().map(|row| row.0).collect::<Vec<_>>()))
}

async fn replace_organizers(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(organizer_ids): Json<Vec<Uuid>>,
) -> Result<StatusCode, StatusCode> {
    let mut tx = state
        .user_repo
        .db_pool
        .begin()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    sqlx::query("DELETE FROM hackathon_organizers WHERE hackathon_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    for organizer_id in organizer_ids {
        sqlx::query(
            "INSERT INTO hackathon_organizers (hackathon_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(organizer_id)
        .execute(&mut *tx)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    tx.commit()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn assign_organizer(
    Path((id, org_id)): Path<(Uuid, Uuid)>,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query(
        "INSERT INTO hackathon_organizers (hackathon_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(id)
    .bind(org_id)
    .execute(state.user_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn unassign_organizer(
    Path((id, org_id)): Path<(Uuid, Uuid)>,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query("DELETE FROM hackathon_organizers WHERE hackathon_id = $1 AND user_id = $2")
        .bind(id)
        .bind(org_id)
        .execute(state.user_repo.db_pool.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}
