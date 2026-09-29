use axum::body::Body;
use axum::extract::{Path, State};
use axum::http::{Response, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::net::{Ipv4Addr, SocketAddr};
use std::sync::{Arc, RwLock};
use tauri::Manager;

const MAX_PROJECT_BYTES: u64 = 5 * 1024 * 1024;
const MAX_ACK_BYTES: usize = 16 * 1024;
const BRIDGE_PORT: u16 = 38472;
const BRIDGE_BIND_ADDR: SocketAddr =
    SocketAddr::new(std::net::IpAddr::V4(Ipv4Addr::LOCALHOST), BRIDGE_PORT);

#[derive(Clone, Default)]
struct BridgeState {
    data: Arc<RwLock<BridgeData>>,
}

#[derive(Default)]
struct BridgeData {
    latest_export: Option<Value>,
    status: BridgeStatus,
}

#[derive(Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
struct BridgeStatus {
    status: String,
    address: String,
    last_error: Option<String>,
    last_ack: Option<AckReceipt>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AckReceipt {
    export_id: String,
    status: String,
    message: String,
    studio_place_id: Option<u64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AckRequest {
    status: String,
    message: String,
    studio_place_id: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    service: &'static str,
    protocol_version: u8,
    status: &'static str,
}

impl BridgeState {
    fn new() -> Self {
        Self {
            data: Arc::new(RwLock::new(BridgeData {
                latest_export: None,
                status: BridgeStatus {
                    status: "starting".to_owned(),
                    address: BRIDGE_BIND_ADDR.to_string(),
                    last_error: None,
                    last_ack: None,
                },
            })),
        }
    }

    fn status(&self) -> BridgeStatus {
        self.data
            .read()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
            .status
            .clone()
    }

    fn set_server_status(&self, status: &str, error: Option<String>) {
        let mut data = self
            .data
            .write()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        data.status.status = status.to_owned();
        data.status.last_error = error;
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let bridge = BridgeState::new();
            app.manage(bridge.clone());
            std::thread::Builder::new()
                .name("roblox-animator-bridge".to_owned())
                .spawn(move || {
                    let runtime = match tokio::runtime::Builder::new_multi_thread()
                        .enable_io()
                        .build()
                    {
                        Ok(runtime) => runtime,
                        Err(error) => {
                            bridge.set_server_status("error", Some(error.to_string()));
                            return;
                        }
                    };
                    runtime.block_on(serve_bridge(bridge));
                })?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_project_file,
            save_project_file,
            prepare_export,
            get_bridge_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn serve_bridge(state: BridgeState) {
    let listener = match tokio::net::TcpListener::bind(BRIDGE_BIND_ADDR).await {
        Ok(listener) => listener,
        Err(error) => {
            state.set_server_status("error", Some(error.to_string()));
            return;
        }
    };
    state.set_server_status("connected", None);
    if let Err(error) = axum::serve(listener, bridge_router(state.clone())).await {
        state.set_server_status("error", Some(error.to_string()));
    }
}

fn bridge_router(state: BridgeState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/v1/exports/latest", get(latest_export))
        .route("/api/v1/exports/{export_id}/ack", post(ack_export))
        .layer(axum::extract::DefaultBodyLimit::max(MAX_ACK_BYTES))
        .with_state(state)
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        service: "roblox-animator-bridge",
        protocol_version: 1,
        status: "ok",
    })
}

async fn latest_export(State(state): State<BridgeState>) -> Response<Body> {
    let latest = state
        .data
        .read()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
        .latest_export
        .clone();
    match latest {
        Some(export) => Json(export).into_response(),
        None => StatusCode::NO_CONTENT.into_response(),
    }
}

async fn ack_export(
    Path(export_id): Path<String>,
    State(state): State<BridgeState>,
    Json(request): Json<AckRequest>,
) -> impl IntoResponse {
    if !["imported", "rejected", "error"].contains(&request.status.as_str())
        || request.message.len() > 512
    {
        return StatusCode::BAD_REQUEST;
    }
    let mut data = state
        .data
        .write()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let Some(latest_id) = data
        .latest_export
        .as_ref()
        .and_then(|export| export.get("exportId"))
        .and_then(Value::as_str)
    else {
        return StatusCode::NOT_FOUND;
    };
    if latest_id != export_id {
        return StatusCode::NOT_FOUND;
    }
    data.status.last_ack = Some(AckReceipt {
        export_id,
        status: request.status,
        message: request.message,
        studio_place_id: request.studio_place_id,
    });
    StatusCode::NO_CONTENT
}

fn validate_export_content(contents: &str) -> Result<Value, String> {
    if contents.len() as u64 > MAX_PROJECT_BYTES {
        return Err("Export payload exceeds the 5 MB size limit.".to_owned());
    }
    let export: Value = serde_json::from_str(contents)
        .map_err(|error| format!("Export payload contains invalid JSON: {error}"))?;
    let valid = export.get("protocolVersion").and_then(Value::as_u64) == Some(1)
        && export
            .get("exportId")
            .and_then(Value::as_str)
            .is_some_and(|export_id| !export_id.trim().is_empty())
        && export
            .get("project")
            .and_then(|project| project.get("schemaVersion"))
            .and_then(Value::as_u64)
            == Some(1)
        && export.get("frames").is_some_and(Value::is_array);
    if !valid {
        return Err("Export payload must be a valid ExportEnvelopeV1.".to_owned());
    }
    Ok(export)
}

fn store_latest_export(state: &BridgeState, export: Value) {
    let mut data = state
        .data
        .write()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    data.latest_export = Some(export);
    data.status.last_ack = None;
}

#[tauri::command]
fn prepare_export(contents: String, state: tauri::State<'_, BridgeState>) -> Result<(), String> {
    let export = validate_export_content(&contents)?;
    store_latest_export(&state, export);
    Ok(())
}

#[tauri::command]
fn get_bridge_status(state: tauri::State<'_, BridgeState>) -> BridgeStatus {
    state.status()
}

fn validate_project_path(path: &std::path::Path) -> Result<(), String> {
    if !path
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("rbanim"))
    {
        return Err("Project files must use the .rbanim extension.".to_owned());
    }
    Ok(())
}

fn validate_project_content(contents: &str) -> Result<(), String> {
    if contents.len() as u64 > MAX_PROJECT_BYTES {
        return Err("Project file exceeds the 5 MB size limit.".to_owned());
    }
    let value: serde_json::Value = serde_json::from_str(contents)
        .map_err(|error| format!("Project file contains invalid JSON: {error}"))?;
    if !value.is_object() || value.get("schemaVersion").and_then(|value| value.as_u64()) != Some(1)
    {
        return Err("Project file must be an object with schemaVersion 1.".to_owned());
    }
    Ok(())
}

#[tauri::command]
fn load_project_file(path: String) -> Result<String, String> {
    let path = std::path::PathBuf::from(path);
    validate_project_path(&path)?;
    let metadata =
        std::fs::metadata(&path).map_err(|error| format!("Cannot open project: {error}"))?;
    if metadata.len() > MAX_PROJECT_BYTES {
        return Err("Project file exceeds the 5 MB size limit.".to_owned());
    }
    let contents = std::fs::read_to_string(path)
        .map_err(|error| format!("Cannot read project file: {error}"))?;
    validate_project_content(&contents)?;
    Ok(contents)
}

#[tauri::command]
fn save_project_file(path: String, contents: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(path);
    validate_project_path(&path)?;
    validate_project_content(&contents)?;
    let parent = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| std::path::Path::new("."));
    let temporary = tempfile::NamedTempFile::new_in(parent)
        .map_err(|error| format!("Cannot create a temporary project file: {error}"))?;
    use std::io::Write;
    let mut file = temporary;
    file.write_all(contents.as_bytes())
        .and_then(|()| file.as_file().sync_all())
        .map_err(|error| format!("Cannot write project file: {error}"))?;
    file.persist(&path)
        .map_err(|error| format!("Cannot safely replace project file: {}", error.error))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        bridge_router, load_project_file, save_project_file, store_latest_export,
        validate_export_content, validate_project_content, BridgeState, BRIDGE_BIND_ADDR,
        MAX_PROJECT_BYTES,
    };
    use axum::body::{to_bytes, Body};
    use axum::http::{Method, Request, StatusCode};
    use serde_json::json;
    use tower::ServiceExt;

    #[test]
    fn bootstrap_smoke_test() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn project_json_validation_rejects_invalid_and_future_schema() {
        assert!(validate_project_content("not json").is_err());
        assert!(validate_project_content(r#"{"schemaVersion":2}"#).is_err());
        assert!(validate_project_content(r#"{"schemaVersion":1}"#).is_ok());
    }

    #[test]
    fn project_file_roundtrip_uses_atomic_write_and_preserves_markers() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("throw-rock.rbanim");
        let source = r#"{"schemaVersion":1,"markers":[{"id":"throw","frame":16,"name":"THROW"}]}"#;
        save_project_file(path.to_string_lossy().to_string(), source.to_owned()).unwrap();
        let reopened = load_project_file(path.to_string_lossy().to_string()).unwrap();
        let source_json: serde_json::Value = serde_json::from_str(source).unwrap();
        let reopened_json: serde_json::Value = serde_json::from_str(&reopened).unwrap();
        assert_eq!(reopened_json, source_json);
        let updated =
            r#"{"schemaVersion":1,"markers":[{"id":"release","frame":18,"name":"RELEASE"}]}"#;
        save_project_file(path.to_string_lossy().to_string(), updated.to_owned()).unwrap();
        let reopened = load_project_file(path.to_string_lossy().to_string()).unwrap();
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(&reopened).unwrap(),
            serde_json::from_str::<serde_json::Value>(updated).unwrap()
        );
    }

    fn test_export(export_id: &str) -> serde_json::Value {
        json!({
            "protocolVersion": 1,
            "exportId": export_id,
            "createdAt": "2026-01-01T00:00:00Z",
            "project": { "schemaVersion": 1 },
            "frames": []
        })
    }

    #[tokio::test]
    async fn bridge_health_latest_and_ack_routes_work() {
        let state = BridgeState::new();
        let app = bridge_router(state.clone());

        let health = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(health.status(), StatusCode::OK);
        let health_body = to_bytes(health.into_body(), 4096).await.unwrap();
        let health_json: serde_json::Value = serde_json::from_slice(&health_body).unwrap();
        assert_eq!(health_json["protocolVersion"], 1);

        let empty = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/exports/latest")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(empty.status(), StatusCode::NO_CONTENT);

        store_latest_export(&state, test_export("export-123"));
        let latest = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/exports/latest")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(latest.status(), StatusCode::OK);
        let latest_body = to_bytes(latest.into_body(), 4096).await.unwrap();
        let latest_json: serde_json::Value = serde_json::from_slice(&latest_body).unwrap();
        assert_eq!(latest_json["exportId"], "export-123");

        let ack = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/exports/export-123/ack")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"status":"imported","message":"KeyframeSequence created","studioPlaceId":null}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(ack.status(), StatusCode::NO_CONTENT);
        assert_eq!(state.status().last_ack.unwrap().export_id, "export-123");

        let stale_ack = app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/exports/wrong-id/ack")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"status":"imported","message":"ok"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(stale_ack.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn bridge_rejects_bad_ack_unknown_routes_wrong_methods_and_large_bodies() {
        let state = BridgeState::new();
        store_latest_export(&state, test_export("export-123"));
        let app = bridge_router(state);

        let bad_ack = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/exports/export-123/ack")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"status":"unknown","message":"bad"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(bad_ack.status(), StatusCode::BAD_REQUEST);

        let unknown = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/unknown")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(unknown.status(), StatusCode::NOT_FOUND);

        let wrong_method = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(wrong_method.status(), StatusCode::METHOD_NOT_ALLOWED);

        let too_large = app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/exports/export-123/ack")
                    .header("content-type", "application/json")
                    .body(Body::from(format!(
                        r#"{{"status":"imported","message":"{}"}}"#,
                        "x".repeat(20 * 1024)
                    )))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(too_large.status(), StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[test]
    fn bridge_accepts_only_valid_bounded_export_envelopes_and_binds_localhost() {
        let valid = test_export("export-123").to_string();
        assert!(validate_export_content(&valid).is_ok());
        assert!(validate_export_content(r#"{"protocolVersion":2}"#).is_err());
        assert!(validate_export_content(&"x".repeat(MAX_PROJECT_BYTES as usize + 1)).is_err());
        assert_eq!(BRIDGE_BIND_ADDR.ip().to_string(), "127.0.0.1");
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn bridge_serves_health_and_latest_export_over_a_real_loopback_socket() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let state = BridgeState::new();
        store_latest_export(&state, test_export("live-export"));
        let server = tokio::spawn(async move {
            axum::serve(listener, bridge_router(state)).await.unwrap();
        });

        let responses = tokio::task::spawn_blocking(move || {
            use std::io::{Read, Write};
            use std::net::TcpStream;
            use std::time::Duration;

            let request = |path: &str| -> Result<String, std::io::Error> {
                let mut stream = TcpStream::connect_timeout(&address, Duration::from_secs(2))?;
                stream.set_read_timeout(Some(Duration::from_secs(2)))?;
                write!(
                    stream,
                    "GET {path} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n"
                )?;
                let mut response = String::new();
                stream.read_to_string(&mut response)?;
                Ok(response)
            };
            Ok::<_, std::io::Error>((request("/health")?, request("/api/v1/exports/latest")?))
        })
        .await
        .unwrap()
        .unwrap();
        server.abort();

        assert!(responses.0.starts_with("HTTP/1.1 200 OK"));
        assert!(responses.0.contains("roblox-animator-bridge"));
        assert!(responses.0.contains("protocolVersion"));
        assert!(responses.1.starts_with("HTTP/1.1 200 OK"));
        assert!(responses.1.contains("live-export"));
    }
}
