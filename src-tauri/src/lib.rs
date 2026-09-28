#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            load_project_file,
            save_project_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

const MAX_PROJECT_BYTES: u64 = 5 * 1024 * 1024;

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
    use super::{load_project_file, save_project_file, validate_project_content};

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
}
