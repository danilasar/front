use axum::{Router, middleware::from_fn, response::IntoResponse, routing::get};
use utoipa::{
    OpenApi,
    openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
};
use utoipa_swagger_ui::SwaggerUi;
use http::header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE};
use tower_http::cors::{Any, CorsLayer};

#[derive(OpenApi)]
#[openapi(info(title = "Hackathon Manager API", version = "1.0.0"))]
struct ApiDoc;

use crate::{
    config::AppState,
    handlers::{
        auth::{AuthDocs, AuthRouter},
        users::{UserDocs, UserRouter},
        hackathons::{HackathonDocs, HackathonRouter},
        admin::AdminRouter,
        teams::TeamRouter,
        forms::FormRouter,
        invitations::InvitationRouter,
        misc::MiscRouter,
    }, middlewares::{auth::auth_middleware, role::role_middleware}, models::users::Role,
};

pub fn create_app(state: AppState) -> Router {
    let swagger_router = get_swagger_routes();
    let all_routers = get_all_routes(state.clone());

    Router::new()
        .merge(all_routers)
        .merge(swagger_router)
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers([AUTHORIZATION, CONTENT_TYPE, ACCEPT]),
        )
}

pub fn get_swagger_routes() -> SwaggerUi {
    let mut open_api = ApiDoc::openapi()
        .nest("/auth", AuthDocs::openapi())
        .nest("/users", UserDocs::openapi())
        .nest("/hackathons", HackathonDocs::openapi())
        .nest("/aboba", AbobaDocs::openapi());

    open_api
        .components
        .get_or_insert_with(Default::default)
        .add_security_scheme(
            "bearer_auth",
            SecurityScheme::Http(
                HttpBuilder::new()
                    .scheme(HttpAuthScheme::Bearer)
                    .bearer_format("JWT")
                    .build(),
            ),
        );
    SwaggerUi::new("/docs").url("/api-docs/openapi.json", open_api)
}

pub fn get_all_routes(state: AppState) -> Router<AppState> {
    let user_router = UserRouter::set_router(state.clone());
    let auth_router = AuthRouter::set_router();
    let hackathon_router = HackathonRouter::set_router();
    let admin_router = AdminRouter::set_router();
    let team_router = TeamRouter::set_router();
    let form_router = FormRouter::set_router();
    let invitation_router = InvitationRouter::set_router();
    let misc_router = MiscRouter::set_router();

    let protect_aboba_router = Router::new()
        .route("/abobus", get(aboba))
        .route_layer(from_fn(move |req, next| async move {
            role_middleware(req, next, Role::all()).await
        }))
        .route_layer({
            let token_serv = state.token_serv.clone();
            from_fn(move |req, next| {
                let token_serv = token_serv.clone();
                async move { auth_middleware(req, next, token_serv.clone()).await }
            })
        });

    let api_router = Router::new()
        .nest("/aboba", protect_aboba_router)
        .nest("/auth", auth_router)
        .nest("/users", user_router)
        .nest("/hackathons", hackathon_router)
        .nest("/hackathons/{hackathon_id}/teams", team_router)
        .nest("/hackathons/{hackathon_id}/form-fields", form_router)
        .nest("/admin", admin_router)
        .nest("/invitations", invitation_router)
        .merge(misc_router);

    Router::new().nest("/api/v1", api_router)
}

#[derive(OpenApi)]
#[openapi(paths(aboba))]
pub struct AbobaDocs;
#[utoipa::path(
    get,
    path = "/abobus",
    security(
        ("bearer_auth" = [])
    ),
    tag = "aboba",
    responses(
        (status = 200, description = "Aboba", body = String),
        (status = 500, description = "Технические шокаладки", body = String)
    )
)]
async fn aboba() -> impl IntoResponse {
    "aboba".to_string()
}
