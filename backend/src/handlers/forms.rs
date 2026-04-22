use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, patch},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::config::AppState;

pub struct FormRouter;

impl FormRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/", get(list_fields).post(create_field))
            .route("/{field_id}", patch(update_field).delete(delete_field))
    }
}

#[derive(Debug, Deserialize)]
struct FieldQuery {
    scope: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct FormFieldResponse {
    id: Uuid,
    hackathon_id: Uuid,
    scope: String,
    key: String,
    label: String,
    description: Option<String>,
    #[serde(rename = "type")]
    field_type: String,
    required: bool,
    visible: bool,
    #[sqlx(rename = "field_order")]
    order: i32,
    options: serde_json::Value,
    validation: serde_json::Value,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FormFieldRequest {
    scope: String,
    key: String,
    label: String,
    description: Option<String>,
    #[serde(rename = "type")]
    field_type: String,
    required: bool,
    visible: bool,
    order: i32,
    options: Option<serde_json::Value>,
    validation: Option<serde_json::Value>,
}

async fn list_fields(
    Path(hackathon_id): Path<Uuid>,
    Query(query): Query<FieldQuery>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let fields = if let Some(scope) = query.scope {
        sqlx::query_as::<_, FormFieldResponse>(
            r#"SELECT id, hackathon_id, scope, key, label, description, type as field_type, required, visible, field_order, COALESCE(options, '[]'::jsonb) as options, COALESCE(validation, '{}'::jsonb) as validation
            FROM form_fields
            WHERE hackathon_id = $1 AND scope = $2
            ORDER BY field_order ASC"#,
        )
        .bind(hackathon_id)
        .bind(scope)
        .fetch_all(state.hackathon_repo.db_pool.as_ref())
        .await
    } else {
        sqlx::query_as::<_, FormFieldResponse>(
            r#"SELECT id, hackathon_id, scope, key, label, description, type as field_type, required, visible, field_order, COALESCE(options, '[]'::jsonb) as options, COALESCE(validation, '{}'::jsonb) as validation
            FROM form_fields
            WHERE hackathon_id = $1
            ORDER BY field_order ASC"#,
        )
        .bind(hackathon_id)
        .fetch_all(state.hackathon_repo.db_pool.as_ref())
        .await
    }
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(fields))
}

async fn create_field(
    Path(hackathon_id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<FormFieldRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let field = sqlx::query_as::<_, FormFieldResponse>(
        r#"INSERT INTO form_fields (id, hackathon_id, scope, key, label, description, type, required, visible, field_order, options, validation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, hackathon_id, scope, key, label, description, type as field_type, required, visible, field_order, COALESCE(options, '[]'::jsonb) as options, COALESCE(validation, '{}'::jsonb) as validation"#,
    )
    .bind(Uuid::new_v4())
    .bind(hackathon_id)
    .bind(payload.scope)
    .bind(payload.key)
    .bind(payload.label)
    .bind(payload.description)
    .bind(payload.field_type)
    .bind(payload.required)
    .bind(payload.visible)
    .bind(payload.order)
    .bind(payload.options.unwrap_or_else(|| serde_json::json!([])))
    .bind(payload.validation.unwrap_or_else(|| serde_json::json!({})))
    .fetch_one(state.hackathon_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(field)))
}

async fn update_field(
    Path((_hackathon_id, field_id)): Path<(Uuid, Uuid)>,
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, StatusCode> {
    if let Some(required) = payload.get("required").and_then(|value| value.as_bool()) {
        sqlx::query("UPDATE form_fields SET required = $2 WHERE id = $1")
            .bind(field_id)
            .bind(required)
            .execute(state.hackathon_repo.db_pool.as_ref())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }
    if let Some(visible) = payload.get("visible").and_then(|value| value.as_bool()) {
        sqlx::query("UPDATE form_fields SET visible = $2 WHERE id = $1")
            .bind(field_id)
            .bind(visible)
            .execute(state.hackathon_repo.db_pool.as_ref())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    let field = sqlx::query_as::<_, FormFieldResponse>(
        r#"SELECT id, hackathon_id, scope, key, label, description, type as field_type, required, visible, field_order, COALESCE(options, '[]'::jsonb) as options, COALESCE(validation, '{}'::jsonb) as validation
        FROM form_fields
        WHERE id = $1"#,
    )
    .bind(field_id)
    .fetch_optional(state.hackathon_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(field))
}

async fn delete_field(
    Path((_hackathon_id, field_id)): Path<(Uuid, Uuid)>,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query("DELETE FROM form_fields WHERE id = $1")
        .bind(field_id)
        .execute(state.hackathon_repo.db_pool.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}
