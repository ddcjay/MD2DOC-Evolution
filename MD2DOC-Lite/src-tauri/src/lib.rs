use std::path::{Path, PathBuf};

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct MarkdownDocument {
    file_name: String,
    file_path: String,
    content: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct SavedMarkdown {
    file_name: String,
    file_path: String,
}

#[tauri::command]
fn save_file(file_name: String, bytes: Vec<u8>) -> Result<(), String> {
    let path = rfd::FileDialog::new()
        .set_file_name(&file_name)
        .save_file()
        .ok_or_else(|| "save cancelled".to_string())?;

    std::fs::write(path, bytes).map_err(|error| error.to_string())
}

#[tauri::command]
fn read_markdown_file(path: String) -> Result<MarkdownDocument, String> {
    read_markdown_from_path(PathBuf::from(path))
}

#[tauri::command]
fn open_markdown_file() -> Result<Option<MarkdownDocument>, String> {
    let path = rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown", "mdown", "txt"])
        .pick_file();

    path.map(read_markdown_from_path).transpose()
}

#[tauri::command]
fn write_markdown_file(path: String, content: String) -> Result<SavedMarkdown, String> {
    let path = PathBuf::from(path);
    ensure_markdown_path(&path)?;
    std::fs::write(&path, content).map_err(|error| error.to_string())?;
    saved_markdown_from_path(&path)
}

#[tauri::command]
fn save_markdown_file(file_name: String, content: String) -> Result<Option<SavedMarkdown>, String> {
    let path = rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown", "mdown", "txt"])
        .set_file_name(file_name)
        .save_file();

    match path {
        Some(path) => {
            ensure_markdown_path(&path)?;
            std::fs::write(&path, content).map_err(|error| error.to_string())?;
            saved_markdown_from_path(&path).map(Some)
        }
        None => Ok(None),
    }
}

fn read_markdown_from_path(path: PathBuf) -> Result<MarkdownDocument, String> {
    ensure_markdown_path(&path)?;
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "invalid file name".to_string())?
        .to_string();
    let file_path = path.to_string_lossy().to_string();
    let content = std::fs::read_to_string(path).map_err(|error| error.to_string())?;

    Ok(MarkdownDocument {
        file_name,
        file_path,
        content,
    })
}

fn saved_markdown_from_path(path: &Path) -> Result<SavedMarkdown, String> {
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "invalid file name".to_string())?
        .to_string();
    let file_path = path.to_string_lossy().to_string();

    Ok(SavedMarkdown {
        file_name,
        file_path,
    })
}

fn ensure_markdown_path(path: &Path) -> Result<(), String> {
    if is_markdown_path(path) {
        Ok(())
    } else {
        Err("unsupported file type".to_string())
    }
}

fn is_markdown_path(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            matches!(
                extension.to_ascii_lowercase().as_str(),
                "md" | "markdown" | "mdown" | "txt"
            )
        })
        .unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_file,
            read_markdown_file,
            open_markdown_file,
            write_markdown_file,
            save_markdown_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running MD2DOC Lite");
}
