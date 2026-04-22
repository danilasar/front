mod common;

use common::TestApp;
use reqwest::StatusCode;
use serde_json::json;

#[tokio::test]
async fn test_register_and_login() {
    let app = TestApp::spawn().await;
    let client = reqwest::Client::new();

    let email = format!("test_{}@example.com", uuid::Uuid::new_v4());
    let password = "password123";

    // 1. Регистрация
    let register_res = client
        .post(format!("{}/api/v1/auth/register", app.addr))
        .json(&json!({
            "fullName": "Test User",
            "email": email,
            "password": password
        }))
        .send()
        .await
        .unwrap();

    assert_eq!(register_res.status(), StatusCode::CREATED);
    let body: serde_json::Value = register_res.json().await.unwrap();
    assert!(body["tokens"]["accessToken"].is_string());

    // 2. Логин
    let login_res = client
        .post(format!("{}/api/v1/auth/login", app.addr))
        .json(&json!({
            "email": email,
            "password": password
        }))
        .send()
        .await
        .unwrap();

    assert_eq!(login_res.status(), StatusCode::OK);
    let body: serde_json::Value = login_res.json().await.unwrap();
    assert!(body["tokens"]["accessToken"].is_string());
}

#[tokio::test]
async fn test_login_invalid_credentials() {
    let app = TestApp::spawn().await;
    let client = reqwest::Client::new();

    let login_res = client
        .post(format!("{}/api/v1/auth/login", app.addr))
        .json(&json!({
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }))
        .send()
        .await
        .unwrap();

    assert_eq!(login_res.status(), StatusCode::UNAUTHORIZED);
}
