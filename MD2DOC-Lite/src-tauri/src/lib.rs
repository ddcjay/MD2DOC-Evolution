#[tauri::command]
fn save_file(file_name: String, bytes: Vec<u8>) -> Result<(), String> {
    let path = rfd::FileDialog::new()
        .set_file_name(&file_name)
        .save_file()
        .ok_or_else(|| "save cancelled".to_string())?;

    std::fs::write(path, bytes).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_file])
        .run(tauri::generate_context!())
        .expect("error while running MD2DOC Lite");
}
