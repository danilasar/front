mod common;

use common::TestApp;
use reqwest::StatusCode;
use serde_json::json;

#[tokio::test]
async fn test_create_and_list_hackathons() {
    let app = TestApp::spawn().await;
    let client = reqwest::Client::new();

    // 1. Список пуст (или содержит что-то из БД)
    let list_res = client
        .get(format!("{}/api/v1/hackathons", app.addr))
        .send()
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);

    // 2. Создаем хакатон
    let create_res = client
        .post(format!("{}/api/v1/hackathons", app.addr))
        .json(&json!({
            "title": "Test Hackathon",
            "description": "Interesting hackathon",
            "startsAt": "2026-01-01T10:00:00Z",
            "endsAt": "2026-01-03T18:00:00Z",
            "registrationOpensAt": "2025-12-01T10:00:00Z",
            "registrationClosesAt": "2025-12-25T18:00:00Z",
            "minTeamSize": 2,
            "maxTeamSize": 5
        }))
        .send()
        .await
        .unwrap();

    assert_eq!(create_res.status(), StatusCode::CREATED);
    let hackathon: serde_json::Value = create_res.json().await.unwrap();
    let hackathon_id = hackathon["id"].as_str().unwrap();

    // 3. Получаем детали
    let get_res = client
        .get(format!("{}/api/v1/hackathons/{}", app.addr, hackathon_id))
        .send()
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let body: serde_json::Value = get_res.json().await.unwrap();
    assert_eq!(body["title"], "Test Hackathon");
}
