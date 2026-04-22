use dotenv::dotenv;
use std::net::SocketAddr;
use std::sync::Arc;

use axum_template::config::*;
use axum_template::routes::create_app;
use axum_template::traicing::init_tracing;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let _ = init_tracing();

    let config = Config::from_env();
    let db_pool = Arc::new(get_db_pool(&config.database_url).await);
    let state = AppState::new(
        db_pool,
        config.secret_key.to_owned(),
        config.secret_refresh_key.to_owned(),
    );
    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));

    let app = create_app(state);

    println!("Listening on http://{}", &addr);
    println!("Swagger on http://{}/docs", &addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}
