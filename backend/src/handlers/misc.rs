use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{config::AppState, repositories::teams::TeamRepository};

pub struct MiscRouter;

impl MiscRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/hackathons/{id}/feedback", get(list_feedback).post(submit_feedback))
            .route("/files", post(upload_file))
            .route("/files/{id}", get(get_file))
            .route("/hackathons/{id}/exports/teams", get(export_teams))
    }
}

#[derive(Deserialize)]
struct ExportQuery {
    format: Option<String>,
}

async fn list_feedback() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn submit_feedback() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn upload_file() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn get_file() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_FOUND)
}

async fn export_teams(
    Path(id): Path<Uuid>,
    Query(query): Query<ExportQuery>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let teams = state
        .team_repo
        .get_by_hackathon(&id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut body = String::from("id,name,status,submitted_at,moderation_reason\n");
    for team in teams {
        body.push_str(&format!(
            "{},{},{},{},{}\n",
            team.id,
            team.name.replace(',', " "),
            String::from(team.status),
            team.submitted_at
                .map(|date| date.to_rfc3339())
                .unwrap_or_default(),
            team.moderation_reason.unwrap_or_default().replace(',', " "),
        ));
    }

    let extension = query.format.as_deref().unwrap_or("csv");
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/csv; charset=utf-8"),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!("attachment; filename=\"teams.{extension}\""))
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    );

    Ok((headers, body))
}
