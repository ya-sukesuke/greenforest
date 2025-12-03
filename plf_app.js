document.getElementById("imgInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("imgPreview");
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
});