document.getElementById("imgInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("imgPreview");
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
});

const ageSelect = document.getElementById("ageSelect");

for (let age = 0; age <= 30; age++) {
  const option = document.createElement("option");
  option.value = age;
  option.textContent = `${age}歳`;
  ageSelect.appendChild(option);
}
