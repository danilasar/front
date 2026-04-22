use std::sync::Arc;
use axum_template::config::{AppState, Config, get_db_pool};
use axum_template::routes::create_app;
use tokio::net::TcpListener;
use axum_template::traicing::init_tracing;

pub struct TestApp {
    pub addr: String,
    pub state: AppState,
}

impl TestApp {
    pub async fn spawn() -> Self {
        dotenv::dotenv().ok();
        // Пытаемся инициализировать трассировку, игнорируем если уже инициализирована
        let _ = init_tracing();
        
        let config = Config::from_env();
        
        let db_pool = Arc::new(get_db_pool(&config.database_url).await);
        let state = AppState::new(
            db_pool,
            config.secret_key.clone(),
            config.secret_refresh_key.clone(),
        );

        let app = create_app(state.clone());
        
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        
        tokio::spawn(async move {
            axum::serve(listener, app.into_make_service()).await.unwrap();
        });

        Self {
            addr: format!("http://{}", addr),
            state,
        }
    }
}
